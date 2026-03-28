import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

const Contact = () => {
  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 0",
      }}
    >
      <Container>
        <Row className="justify-content-center text-center">
          <Col md={8}>
            <h1 style={{ color: "#ffcc00", marginBottom: "30px" }}>
              Get in Touch
            </h1>
            <p style={{ fontSize: "18px", color: "#ccc", marginBottom: "40px" }}>
              Have questions, suggestions, or just want to connect?  
              I’d love to hear from you. Feel free to reach out using the options below.
            </p>

            <Card
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "15px",
                padding: "30px",
              }}
            >
              <Row className="gy-3 justify-content-center">
                <Col xs={12} md={4}>
                  <Button
                    variant="outline-warning"
                    href="https://www.linkedin.com/in/aryan-srivastava-29a9a031a/"
                    target="_blank"
                    style={{
                      width: "100%",
                      fontWeight: "bold",
                      borderRadius: "10px",
                    }}
                  >
                    💼 LinkedIn
                  </Button>
                </Col>

                <Col xs={12} md={4}>
                  <Button
                    variant="outline-light"
                    href="https://github.com/SpartanOpJod"
                    target="_blank"
                    style={{
                      width: "100%",
                      fontWeight: "bold",
                      borderRadius: "10px",
                    }}
                  >
                    🧑‍💻 GitHub
                  </Button>
                </Col>

                <Col xs={12} md={4}>
                  <Button
                    variant="warning"
                    href="mailto:aryanopjod@gmail.com"
                    style={{
                      width: "100%",
                      fontWeight: "bold",
                      color: "#000",
                      borderRadius: "10px",
                    }}
                  >
                    ✉️ Email Me
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Contact;
