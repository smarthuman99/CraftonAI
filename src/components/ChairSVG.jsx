import React from "react";

const ChairSVG = ({ fabricId, legId, animateStyle = {} }) => {
  // Map fabricId to corresponding AI generated stool images in the public directory
  const stoolImages = [
    { id: "FAB-01", src: "/stool_velvet.jpg", alt: "Royal Velvet Stool" },
    { id: "FAB-02", src: "/stool_linen.jpg", alt: "Navy Classic Linen Stool" },
    { id: "FAB-03", src: "/stool_silk.jpg", alt: "Pure Silk Satin Stool" },
    { id: "FAB-04", src: "/stool_leather.jpg", alt: "A-Class Cow Leather Stool" }
  ];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        borderRadius: "4px",
        ...animateStyle
      }}
    >
      {stoolImages.map((stool) => {
        const isActive = fabricId === stool.id;
        return (
          <img
            key={stool.id}
            src={stool.src}
            alt={stool.alt}
            className={`showroom-stool-img ${isActive ? "active" : ""}`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: isActive ? "auto" : "none"
            }}
          />
        );
      })}
    </div>
  );
};

export default ChairSVG;
