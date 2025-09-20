{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs   # The Node.js package
    pkgs.yarn     # If you want Yarn instead of npm
  ];

  shellHook = ''
    export NODE_ENV=development
    export PATH=$PATH:${pkgs.nodejs}/bin
  '';
}
