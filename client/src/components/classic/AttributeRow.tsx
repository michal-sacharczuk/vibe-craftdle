import React from "react";
import { ClassicGuessFeedback, AttributeFeedback } from "../../types";

interface AttributeRowProps {
  feedback: ClassicGuessFeedback;
}

const ATTRIBUTE_LABELS: {
  key: keyof Omit<ClassicGuessFeedback, "name" | "textureUrl">;
  label: string;
}[] = [
  { key: "type", label: "Type" },
  { key: "dimension", label: "Dimension" },
  { key: "behavior", label: "Behavior" },
  { key: "stackable", label: "Stackable" },
  { key: "renewable", label: "Renewable" },
  { key: "versionAdded", label: "Version" },
];

function formatValue(attr: AttributeFeedback): string {
  const v = attr.value;
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export default function AttributeRow({ feedback }: AttributeRowProps) {
  return (
    <tr className="text-center text-xs">
      <td className="px-3 py-2 font-bold text-left text-mc-gold">
        {feedback.name}
      </td>
      {ATTRIBUTE_LABELS.map(({ key }) => {
        const attr = feedback[key];
        return (
          <td
            key={key}
            className={`px-3 py-2 ${attr.match ? "attr-match" : "attr-no-match"}`}
          >
            {formatValue(attr)}
          </td>
        );
      })}
    </tr>
  );
}

export { ATTRIBUTE_LABELS };
