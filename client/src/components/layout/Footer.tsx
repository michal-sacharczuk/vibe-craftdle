import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-mc-dark border-t-2 border-mc-stone px-6 py-4 mt-auto">
      <div className="max-w-5xl mx-auto text-center space-y-1">
        <p className="text-mc-gray text-xs">
          Craftdle — Data sourced from{" "}
          <a
            href="https://minecraft.wiki"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            minecraft.wiki
          </a>{" "}
          under{" "}
          <a
            href="https://creativecommons.org/licenses/by-nc-sa/3.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            CC BY-NC-SA 3.0
          </a>
        </p>
        <p className="text-mc-gray text-[10px] leading-tight">
          Not affiliated with Mojang Studios, Microsoft, or Minecraft. Minecraft
          is a trademark of Mojang Studios. This is an unofficial fan project —
          non-commercial, for personal and educational use only.
        </p>
      </div>
    </footer>
  );
}
