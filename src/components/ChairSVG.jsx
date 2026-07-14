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
      {(() => {
        const activeStool = stoolImages.find((stool) => stool.id === fabricId) || stoolImages[0];
        return (
          <img
            key={activeStool.id}
            src={activeStool.src}
            alt={activeStool.alt}
            className="showroom-stool-img active"
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain"
            }}
          />
        );
      })()}
    </div>
  );
};

export default ChairSVG;
