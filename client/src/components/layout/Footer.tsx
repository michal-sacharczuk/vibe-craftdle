import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-mc-dark border-t-2 border-mc-stone px-6 py-4 mt-auto">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-mc-gray text-xs">
          Craftdle — Data sourced from{" "}
          <a
            href="https://minecraft.wiki"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            minecraft.wiki
          </a>
        </p>
      </div>
    </footer>
  );
}
