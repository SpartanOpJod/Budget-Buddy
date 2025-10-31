import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";

const About = () => {
  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "white",
        minHeight: "100vh",
        paddingTop: "70px",
      }}
    >
      <Container>
        <Row className="text-center">
          <Col>
            <h1 style={{ color: "#ffcc00", marginBottom: "20px" }}>
              About Budget Buddy
            </h1>
            <p style={{ fontSize: "18px", maxWidth: "800px", margin: "0 auto" }}>
              <strong>Budget Buddy</strong> is an intelligent expense tracking
              and budgeting application designed to help users organize their
              finances effectively. It allows you to record income and expenses,
              view analytics, and manage transactions effortlessly through a
              clean and responsive interface.
            </p>

            <p
              style={{
                fontSize: "18px",
                maxWidth: "800px",
                margin: "20px auto",
              }}
            >
              This project was created by <strong>Aryan Srivastava</strong> as
              part of a full-stack development initiative using the MERN stack
              (MongoDB, Express, React, Node.js). It integrates secure
              authentication, database connectivity, and interactive data
              visualization.
            </p>

            <div className="mt-4">
              <Button
                variant="warning"
                href="https://github.com/yourusername/budget-buddy"
                target="_blank"
                style={{ marginRight: "10px" }}
              >
                📘 View GitHub Repository
              </Button>

              <Button
                variant="outline-light"
                href="https://github.com/yourusername/budget-buddy/blob/main/README.md"
                target="_blank"
              >
                🧾 Read User Guide
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default About;
