use std::{collections::HashMap, fs, path::Path};

use memvdb::{CacheDB, Distance, Embedding};
use ollama_rs::{generation::{completion::request::GenerationRequest, embeddings::request::GenerateEmbeddingsRequest}, Ollama};
use prefstore::getcustom;
use shiva::core::{bytes::Bytes, Element, TransformerTrait};
use anyhow::anyhow;
use text_splitter::TextSplitter;
use futures::StreamExt;
use tokio::io::AsyncWriteExt;
pub struct ExtractedDocument {
    pub content: String,
    pub metadata: HashMap<String, String>,
}
fn collect_text_from_elements(elements: &Vec<&Element>, collected_text: &mut String) {
    for element in elements {
       match element {
           Element::Text{text,size} => {
               collected_text.push_str(&text);
           }
           Element::Paragraph{elements} => {
               // Paragraph contains a vector of Elements, often Text, Link etc.
               for items in elements.iter(){
                   collect_text_from_elements(&vec![items], collected_text);
               }
               
               collected_text.push_str("\n\n"); // Add paragraph break
           }
           Element::Header{text,level} => {
               // Header also contains a vector of Elements
               collected_text.push_str(&text); // Add markdown-like header prefix
               collected_text.push(' ');
               // collect_text_from_elements(&h.elements, collected_text);
               // collected_text.push_str("\n\n");
           }
           Element::List{elements,..} => {
               for (i, item) in elements.iter().enumerate() {
               //     collected_text.push_str(&format!("{} ", if list.ordered { format!("{}. ", i + 1) } else { "- ".to_string() }));
                   collect_text_from_elements(&vec![&item.element], collected_text);
                   collected_text.push('\n');
               }
               collected_text.push('\n'); // Add blank line after list
           }
           Element::Table { headers, rows } => {
               for row in rows {
                   for cell in &row.cells {
                       collect_text_from_elements(&vec![&cell.element], collected_text);
                       collected_text.push('\t'); // Tab-separated cells
                   }
                   collected_text.push('\n'); // Newline for each row
               }
               collected_text.push('\n'); // Add blank line after table
           }
           Element::Image(img) => {
               // Image might have alt text or caption
               // if let Some(alt_text) = &img.alt {
                   collected_text.push_str(&format!("[Image: {}]", img.alt()));
               // } else {
                   // collected_text.push_str("[Image]");
               // }
               collected_text.push(' ');
           }
           Element::Hyperlink { title, url, alt, size }=>{
               // Link has elements (the display text) and a URL
               // collect_text_from_elements(&link.elements, collected_text);
               // if let Some(url) = &link.url {
                   collected_text.push_str(&format!("{}", title));
                   collected_text.push_str(&format!(" ({})", url));
               // }
               collected_text.push(' ');
           }
           // Add more as needed:
           // Element::Equation(eq) => collected_text.push_str(&format!("[Equation: {}]", eq.value)),
           // Element::Divider => collected_text.push_str("---\n"),
           // Element::Video(vid) => collected_text.push_str(&format!("[Video: {}]", vid.url.as_deref().unwrap_or(""), vid.title.as_deref().unwrap_or(""))),
           // Element::Audio(aud) => collected_text.push_str(&format!("[Audio: {}]", aud.url.as_deref().unwrap_or(""), aud.title.as_deref().unwrap_or(""))),
           // _ => {
           //     // This catches any new or unhandled element types.
           //     // You might log a warning here if you want to be aware of missed content.
           //     // println!("Unhandled element type: {:?}", element);
           // }
       }
   }
}
/// Helper function to get the document type from a file extension.
fn get_document_type(path: &Path) -> Option<&'static str> {
   path.extension().and_then(|ext| ext.to_str()).map(|s| match s {
       "txt" => "text",
       "rs" => "text",
       "md" => "markdown",
       "html" | "htm" => "html",
       "pdf" => "pdf",
       "json" => "json",
       "csv" => "csv",
       "rtf" => "rtf",
       "docx" => "docx",
       "xml" => "xml",
       "xls" => "xls",
       "xlsx" => "xlsx",
       "ods" => "ods",
       "typst" => "typst",
       _ => "unknown", // Handle unknown types
   })
}
/// Represents the extracted content and metadata of a document.

pub  fn load_document_and_extract_text(file_path: &Path) -> anyhow::Result<ExtractedDocument> {
let file_bytes = fs::read(file_path)?;
let input_bytes = Bytes::from(file_bytes);

let doc_type = get_document_type(file_path)
   .ok_or_else(|| anyhow!("Could not determine document type for {:?}", file_path))?;

let document: shiva::core::Document = match doc_type {
   "text" => shiva::text::Transformer::parse(&input_bytes)?,
   "markdown" => shiva::markdown::Transformer::parse(&input_bytes)?,
   "html" => shiva::html::Transformer::parse(&input_bytes)?,
   "pdf" => shiva::pdf::Transformer::parse(&input_bytes)?,
   "json" => shiva::json::Transformer::parse(&input_bytes)?,
   "csv" => shiva::csv::Transformer::parse(&input_bytes)?,
   "rtf" => shiva::rtf::Transformer::parse(&input_bytes)?,
   "docx" => shiva::docx::Transformer::parse(&input_bytes)?,
   "xml" => shiva::xml::Transformer::parse(&input_bytes)?,
   "xls" => shiva::xls::Transformer::parse(&input_bytes)?,
   "xlsx" => shiva::xlsx::Transformer::parse(&input_bytes)?,
   "ods" => shiva::ods::Transformer::parse(&input_bytes)?,
   "typst" => shiva::typst::Transformer::parse(&input_bytes)?,
   _ => return Err(anyhow!("Unsupported document type: {}", doc_type)),
};

let mut collected_text = String::new();
collect_text_from_elements(&document.get_all_elements(), &mut collected_text);

let mut metadata = HashMap::new();
metadata.insert("file_name".to_string(), file_path.file_name().unwrap_or_default().to_string_lossy().into_owned());
metadata.insert("file_path".to_string(), file_path.to_string_lossy().into_owned());
// Shiva's Document model might have direct metadata fields you can extract.
// E.g., `document.metadata` if it exists and is populated by the parser.
// For now, we're just adding basic file metadata.

Ok(ExtractedDocument {
   content: collected_text.trim().to_string(), // Trim whitespace
   metadata,
})
}


#[tokio::test]
async fn embedtest() {
    use std::collections::HashMap;
    use std::path::Path;

    let question = "hi".to_string();
    let path = "C:\\Users\\wkramer\\DeclarationandAuthorization_FILLED.pdf".to_string();
    // let path = "V:\\Github\\filedime\\src-tauri\\src\\bookmarks.rs".to_string();
    // let path = "C:\\Users\\wkramer\\Downloads\\Data_Sheet_D2Pro_EN.pdf".to_string();

    // Confirm if file exists
    println!("Path {} exists? {}", path, Path::new(&path).exists());

    let ollama_url = getcustom("filedime", "storevals/ollamaurl.set", "http://127.0.0.1:11434");
    let embedding_model = getcustom("filedime", "storevals/embedding_model.set", "nomic-embed-text");
    let embedding_model_name = embedding_model.to_string();

    let ollama = Ollama::from_url(tauri::Url::parse(&ollama_url).unwrap());

    // Load and chunk document
    let input_vec = load_document_and_extract_text(Path::new(&path)).unwrap();
    // println!("{}",input_vec.content);
    let splitter = TextSplitter::new(256);
    let mut seen = std::collections::HashSet::new();
    let chunks: Vec<&str> = splitter.chunks(&input_vec.content).filter(|c| seen.insert(*c)).collect();

    // Generate embeddings
    let embed_req = GenerateEmbeddingsRequest::new(embedding_model_name.clone(), chunks.clone().into());
    let embed_response = ollama.generate_embeddings(embed_req).await.unwrap();
    let embeddings = embed_response.embeddings;

    println!("Successfully generated {} embeddings.", embeddings.len());

    // Store in vector database
    let mut db = CacheDB::new();
    db.create_collection(path.clone(), 768, Distance::Cosine).unwrap();

    for (i, embedding) in embeddings.iter().enumerate() {
        let embedding_data = Embedding {
            id: HashMap::from([(format!("title"), chunks[i].to_string())]),
            vector: embedding.clone(),
            metadata: Some(input_vec.metadata.clone()),
        };

        db.insert_into_collection(&path, embedding_data).unwrap();
    }

    // Generate embeddings for the question
    let mut seen = std::collections::HashSet::new();
    let question_chunks: Vec<&str> = splitter.chunks(&input_vec.content).filter(|c| seen.insert(*c)).collect();

    let query_req = GenerateEmbeddingsRequest::new(embedding_model_name, question_chunks.clone().into());
    let query_response = ollama.generate_embeddings(query_req).await.unwrap();

    let collection = db.get_collection(&path).unwrap();
    let mut retrieved_context = String::new();

    for (i,embedding) in query_response.embeddings.iter().enumerate() {
        for result in collection.get_similarity(embedding, 2) {
                        // println!("{:?}",result.embedding.id);

            if let Some(title) = result.embedding.id.get(&format!("title")) {
                retrieved_context.push_str(title);
                retrieved_context.push_str("\n");
            }
        }
    }

    println!("Retrieved context:\n{}", retrieved_context);

    let prompt = format!("Given the following context which are contents of a file, answer the question accurately and concisely. If the answer is not in the context, state that you cannot answer from the provided information.\n\nContext: ${}\n\nQuestion: ${}", retrieved_context.trim(), question);

    let llm_model="qwen2.5:3b";
    let llm_request = GenerationRequest::new(llm_model.to_string(), prompt);
    // let llm_response = ollama.generate(llm_request).await.unwrap();
    // println!("\n--- LLM Response ---");
    // println!("{}", llm_response.response);
    // println!("--------------------");

    let mut stream = ollama.generate_stream(llm_request).await.unwrap();

		let mut stdout = tokio::io::stdout();
		let mut char_count = 0;

		let mut final_data_responses = Vec::new();

		while let Some(res) = stream.next().await {
			// NOTE: For now, we just flatten this result list since it will most likely be a vec of one.
			//       However, if res.length > 1, we might want to split the output, as those might be for different responses.
			let res_list = res.unwrap();

			for res in res_list {
				let bytes = res.response.as_bytes();

				// Poor man's wrapping
				char_count += bytes.len();
				if char_count > 80 {
					stdout.write_all(b"\n").await.unwrap();
					char_count = 0;
				}

				// Write output
				stdout.write_all(bytes).await.unwrap();
				stdout.flush().await.unwrap();

				if res.done {
					stdout.write_all(b"\n").await.unwrap();
					stdout.flush().await.unwrap();
					final_data_responses.push(res.response.clone());
                    stdout.write_all(b"\n").await.unwrap();
                    stdout.write_all(res.response.as_bytes()).await.unwrap();
                    stdout.flush().await.unwrap();
					break;
				}
			}
		}

		stdout.write_all(b"\n").await.unwrap();
		stdout.flush().await.unwrap();

}

