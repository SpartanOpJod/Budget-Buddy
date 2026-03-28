import React from "react";

const Footer = () => {
  return (
    <footer
      style={{
        textAlign: "center",
        padding: "15px 0",
        backgroundColor: "#000",
        color: "#ffcc00",
        position: "fixed",
        bottom: 0,
        width: "100%",
        fontWeight: "500",
        letterSpacing: "0.5px",
      }}
    >
      © {new Date().getFullYear()} | Built & Designed by <span style={{ fontWeight: "bold" }}>Aryan Srivastava</span>
    </footer>
  );
};

export default Footer;
