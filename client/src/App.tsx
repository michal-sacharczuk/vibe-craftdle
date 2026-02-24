import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ModeSelector from "./components/layout/ModeSelector";
import ClassicGame from "./components/classic/ClassicGame";
import CraftingGame from "./components/crafting/CraftingGame";
import TextureGame from "./components/texture/TextureGame";
import SoundGame from "./components/sound/SoundGame";

function HomePage() {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h1 className="font-minecraft text-2xl text-mc-gold">Craftdle</h1>
      <p className="text-mc-gray text-sm max-w-md text-center">
        A Minecraft-themed guessing game. Choose a mode and start playing!
      </p>
      <ModeSelector />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/classic" element={<ClassicGame />} />
            <Route path="/crafting" element={<CraftingGame />} />
            <Route path="/texture" element={<TextureGame />} />
            <Route path="/sound" element={<SoundGame />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
