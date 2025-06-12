import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { fetchEventSource } from '@microsoft/fetch-event-source';

interface mitem {
    from: string;
    message: string;
    time: string;
    timestamp: number;
}

interface gptargs {
    message?: { path: string };
    fgptendpoint?: string;
    setasollama: boolean;
}

function getchattime() {
    return `${new Date().getHours()}:${new Date().getMinutes() < 10 ? '0' : ''}${new Date().getMinutes()}:${new Date().getSeconds() < 10 ? '0' : ''}${new Date().getSeconds()}`;
}

function getchattimestamp() {
    return new Date().getTime();
}

const FileChatInterface: React.FC<gptargs> = ({ message, fgptendpoint = "localhost", setasollama = false }) => {
    const [isollama, sao] = useState(setasollama);
    const [onemessage, setmessage] = useState("");
    const [filePaths, setFilePaths] = useState([message ? message.path : null]);
    const [chathistory, setchathistory] = useState([{
        from: "bot",
        message: message ? message.path : "Choose files to embed",
        time: getchattime(),
        timestamp: getchattimestamp()
    } as mitem]);
    const [chatbuttonstate, setcbs] = useState(false);
    const [question, setq] = useState("");
    const [filegptendpoint, setfge] = useState(`http://${fgptendpoint}:8694`);
    const [localorremote, setlor] = useState(message ? true : false);
    const [autoscroll, setas] = useState(false);
    const divRef = useRef<HTMLDivElement>(null);
    const [ollamaisrunning, setoir] = useState(false);
    const [filedimegptisrunning, setfgir] = useState(false);
    const [cmsg, setcmsg] = useState("");

    const embed = async () => {
        if (message && message.path) {
            console.log("embed");
            try {
                const response = await axios.post(`${filegptendpoint}/embed`, { files: filePaths });
                sao(false);
                setchathistory((old) => [...old, {
                    from: "bot",
                    message: `${message ? message.path : "The file(s)"} is ready for your questions`,
                    time: getchattime(),
                    timestamp: getchattimestamp()
                }]);
                setcbs(false);
                console.log(response.data);
            } catch (error) {
                setchathistory((old) => [...old, {
                    from: "bot",
                    message: `Issue finding Filegpt endpoint, maybe it's not running.`,
                    time: getchattime(),
                    timestamp: getchattimestamp()
                }]);
                console.error('Error:', error);
            }
        }
    };

    const scrolltobottom = useCallback(() => {
        divRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [onemessage]);

    useEffect(() => {
        if (autoscroll) {
            setTimeout(scrolltobottom, 2); // run the function every 2ms
        }
    }, [onemessage]);

    const fetchData = async () => {
        if (question.toLocaleLowerCase().startsWith("o2c") || !filedimegptisrunning) {
            setchathistory((old) => [...old, {
                from: "bot",
                message: `External query not implemented in this extension.`,
                time: getchattime(),
                timestamp: getchattimestamp()
            }]);
        } else {
            const abortController = new AbortController();
            const signal = abortController.signal;

            await fetchEventSource(`${filegptendpoint}/query-stream`, {
                signal: signal,
                method: "POST",
                body: JSON.stringify({
                    query: question,
                    where: question.toLocaleLowerCase().startsWith("generally") || isollama ? "ollama" : ""
                }),
                headers: { 'Content-Type': 'application/json', Accept: "text/event-stream" },
                onopen: async (res) => {
                    if (res.ok && res.status === 200) {
                        setcbs(true);
                        console.log("Connection made ", res);
                    } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
                        setcbs(false);
                        console.log("Client-side error ", res);
                    }
                },
                onmessage: async (event) => {
                    try {
                        let jp = JSON.parse(event.data);
                        setmessage((old) => {
                            console.log(event.data);
                            let dm = old + jp.token;
                            return dm;
                        });
                    } catch (e) {
                        console.error(e);
                    }
                },
                onclose: async () => {
                    setcbs(false);
                    console.log("Connection closed by the server");
                },
                onerror(err) {
                    setchathistory((old) => [...old, {
                        from: "bot",
                        message: `Issue finding Filegpt endpoint ${filegptendpoint} endpoint, maybe it's not running.`,
                        time: getchattime(),
                        timestamp: getchattimestamp()
                    }]);
                    throw "There was some issue with your filedimegpt instance. Is it not running?";
                },
            });
        }
    };

    const handleSubmit = async () => {
        if (onemessage.trim() !== "") {
            setchathistory((old) => [...old, {
                from: "bot",
                message: onemessage.replace("[DONESTREAM]", ""),
                time: getchattime(),
                timestamp: getchattimestamp()
            }]);
        }
        setchathistory((old) => [...old, {
            from: "you",
            message: `${question}`,
            time: getchattime(),
            timestamp: getchattimestamp()
        }]);

        setmessage("");
        setq("");
        fetchData();
    };

    const oir = async () => {
        try {
            await axios.head(`http://${fgptendpoint}:11434/`); // endpoint to check for ollama
            setoir(true);
        } catch (error) {
            setoir(false);
        }
    };

    const fgtest = async () => {
        try {
            await axios.get(`${filegptendpoint}/`);
            setfgir(true);
        } catch (error) {
            setfgir(false);
        }
    };

    useEffect(() => {
        embed();
        setfge(`http://${fgptendpoint}:8694`);
        fgtest(); // check if filedimegpt is running
        oir(); // check if ollama is running
    }, []);

    useEffect(() => {
        oir();
    }, [fgptendpoint]);

    useEffect(() => {
        console.log(cmsg);
        if (cmsg !== "") {
            setchathistory((old) => [...old, {
                from: "bot",
                message: cmsg,
                time: getchattime(),
                timestamp: getchattimestamp()
            }]);
        }
    }, [cmsg]);

    useEffect(() => {
        console.log(setasollama);
    }, [setasollama]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const filePathsArray = Array.from(files).map(file => file.name);
            setFilePaths(filePathsArray);
            setlor(true);
            setchathistory((old) => [...old, {
                from: "bot",
                message: `Files uploaded: ${filePathsArray.join(", ")}`,
                time: getchattime(),
                timestamp: getchattimestamp()
            }]);
        }
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', padding: '10px', gap: '10px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'row', padding: '10px', border: '2px solid #ccc', alignItems: 'center' }}>
                    {ollamaisrunning ? <span style={{ color: 'green' }}>✓</span> : <span style={{ color: 'red' }}>✗</span>} Ollama
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', padding: '10px', border: '2px solid #ccc', alignItems: 'center' }}>
                    {filedimegptisrunning ? <span style={{ color: 'green' }}>✓</span> : <span style={{ color: 'red' }}>✗</span>} FiledimeGPT
                </div>
            </div>
            {localorremote ? (
                <h1 style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                    <span>🤖</span>FileGPT: {message ? message.path : null}
                </h1>
            ) : (
                <div>
                    <input type="file" multiple onChange={handleFileUpload} style={{ marginBottom: '10px' }} />
                </div>
            )}

            <div style={{ overflow: 'auto', display: 'grid', gap: '10px', padding: '10px', height: '50%', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }} ref={divRef}>
                    {chathistory.map((e, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px' }}>
                            <div>
                                {e.from === "you" ? <span>👤</span> : <span>🤖</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <span style={{ fontSize: '12px', color: '#666' }}>{e.time}</span>
                                <div>{e.message}</div>
                            </div>
                        </div>
                    ))}
                    {onemessage !== "" ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div>
                                <span>🤖</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <span style={{ fontSize: '12px', color: '#666' }}>{getchattime()}</span>
                                <div>{onemessage.replace("[DONESTREAM]", "")}</div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
            <div style={{ padding: '10px', borderTop: '1px solid #ccc', position: 'sticky', bottom: 0 }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <textarea
                        style={{ flex: 1, padding: '5px' }}
                        value={question}
                        placeholder="Ask the file(s)..."
                        onChange={(event) => setq(event.target.value)}
                    />
                    <span style={{ display: chatbuttonstate ? 'inline' : 'none' }}>Loading...</span>
                    <button
                        disabled={chatbuttonstate}
                        style={{ padding: '5px 10px', cursor: chatbuttonstate ? 'not-allowed' : 'pointer' }}
                        onClick={handleSubmit}
                    >
                        Send
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', padding: '10px' }}>
                    <input type="checkbox" checked={autoscroll} onChange={() => setas((cv) => !cv)} />
                    <span>Autoscroll</span>
                </div>
            </div>
        </div>
    );
};

export default FileChatInterface;
