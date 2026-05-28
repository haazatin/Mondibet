"use client";

import { useState, type ReactNode } from "react";

interface CollapsibleAdminPanelProps {
  children: ReactNode;
  description: string;
  title: string;
}

export function CollapsibleAdminPanel({
  children,
  description,
  title,
}: CollapsibleAdminPanelProps) {
  const [isHidden, setIsHidden] = useState(true);

  return (
    <article className="panel wide-panel">
      <div className="section-actions panel-heading-actions">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button
          className="secondary-button"
          onClick={() => setIsHidden((current) => !current)}
          type="button"
        >
          {isHidden ? "Unhide" : "Hide"}
        </button>
      </div>
      {isHidden ? null : children}
    </article>
  );
}
