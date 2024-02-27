{ pkgs ? import <nixpkgs> 
{
  overlays = [(
    self: super: {
	  yarn = super.yarn.override {
	    nodejs = pkgs.nodejs_20;
	  };
    }
  )];
 }
  }:
pkgs.mkShell {

  packages = with pkgs; [
    cargo
#     nodejs
#     gcc
    # npm
    yarn
    nodejs_20
    pkg-config
    cmake
    webkitgtk
    rustup
    gnome.libsoup
    cargo-tauri
    openssl
    bun
    vscode-extensions.rust-lang.rust-analyzer
  rust-analyzer
  ];

#   shellHook = ''
#     export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$PWD/src-tauri
#   '';
}
