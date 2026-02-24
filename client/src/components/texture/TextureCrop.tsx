import React from "react";

interface TextureCropProps {
  imageData: string;
  cropLevel: number;
  centerX?: number;
  centerY?: number;
}

const CROP_SIZES = [4, 6, 8, 10, 12, 16];

export default function TextureCrop({
  imageData,
  cropLevel,
  centerX = 0.5,
  centerY = 0.5,
}: TextureCropProps) {
  const size = CROP_SIZES[Math.min(cropLevel, CROP_SIZES.length - 1)];
  const zoomPercent = Math.round((size / 16) * 100);

  // CSS-based cropping using background-image
  // background-size determines zoom: (16/cropSize) * 100%
  const bgSize = Math.round((16 / size) * 100);
  // background-position sets the crop center
  const bgPosX = Math.round(centerX * 100);
  const bgPosY = Math.round(centerY * 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-mc-stone"
        style={{
          backgroundImage: `url(${imageData})`,
          backgroundSize: `${bgSize}% ${bgSize}%`,
          backgroundPosition: `${bgPosX}% ${bgPosY}%`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          backgroundColor: "#1D1D1D",
        }}
      />
      <span className="font-minecraft text-xs text-mc-gray">
        Visible: {zoomPercent}%
      </span>
    </div>
  );
}
