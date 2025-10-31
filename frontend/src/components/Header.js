import React, { useCallback, useEffect, useState } from "react";
import { Navbar, Nav, Button } from "react-bootstrap";
import "./style.css";
import { useNavigate, Link } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const handleLogin = () => navigate("/login");

  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async () => {}, []);

  return (
    <>
      <div style={{ position: "relative", overflow: "hidden" }}>
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            background: { color: { value: "#000" } },
            fpsLimit: 60,
            particles: {
              number: { value: 200, density: { enable: true, value_area: 800 } },
              color: { value: "#ffcc00" },
              shape: { type: "circle" },
              opacity: { value: 0.5, random: true },
              size: { value: 3, random: { enable: true, minimumValue: 1 } },
              move: { enable: true, speed: 2 },
            },
            detectRetina: true,
          }}
          style={{
            position: "absolute",
            zIndex: -1,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        <Navbar
          className="navbarCSS"
          collapseOnSelect
          expand="lg"
          style={{ position: "relative", zIndex: 2 }}
        >
          <Navbar.Brand as={Link} to="/" className="text-white navTitle">
            💰 Budget Buddy
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            style={{
              backgroundColor: "transparent",
              borderColor: "transparent",
            }}
          >
            <span
              className="navbar-toggler-icon"
              style={{
                background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(255, 255, 255)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e")`,
              }}
            ></span>
          </Navbar.Toggle>

          <Navbar.Collapse id="responsive-navbar-nav" style={{ color: "white" }}>
            <Nav className="ml-auto align-items-center">
              {user ? (
                <>
                  <Nav.Link as={Link} to="/home" className="text-white">
                    Home
                  </Nav.Link>
                  <Nav.Link as={Link} to="/features" className="text-white">
                    Features
                  </Nav.Link>
                  <Nav.Link as={Link} to="/about" className="text-white">
                    About
                  </Nav.Link>
                  <Nav.Link as={Link} to="/contact" className="text-white">
                    Contact
                  </Nav.Link>
                  <Button
                    variant="warning"
                    onClick={handleLogout}
                    className="ml-3"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="warning"
                    onClick={handleLogin}
                    className="ml-3"
                  >
                    Login
                  </Button>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </div>
    </>
  );
};

export default Header;
