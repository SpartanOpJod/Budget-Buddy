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

            <p style={{ fontSize: "18px", maxWidth: "850px", margin: "0 auto" }}>
              <strong>Budget Buddy</strong> is a smart AI-powered expense tracking
              and financial assistant designed to help you take control of your money
              effortlessly. Instead of just recording transactions, it understands your
              spending patterns and gives real-time insights, suggestions, and warnings
              to improve your financial habits.
            </p>

            <p
              style={{
                fontSize: "18px",
                maxWidth: "850px",
                margin: "20px auto",
              }}
            >
              With natural language processing, users can simply type things like
              <em> "spent 500 on food"</em> and Budget Buddy will automatically
              categorize and log the expense. The integrated AI engine analyzes your
              data to provide personalized budgeting advice, highlight overspending,
              and suggest smarter saving strategies.
            </p>

            <p
              style={{
                fontSize: "18px",
                maxWidth: "850px",
                margin: "20px auto",
              }}
            >
              Built using the MERN stack (MongoDB, Express, React, Node.js) and powered
              by modern AI models, this project goes beyond a traditional expense tracker
              by turning raw financial data into meaningful decisions.
            </p>

            <p
              style={{
                fontSize: "18px",
                maxWidth: "850px",
                margin: "20px auto",
              }}
            >
              This project was developed by <strong>Aryan Srivastava</strong> as a
              full-stack + AI application, focusing on real-world problem solving,
              backend architecture, and intelligent data processing.
            </p>

            <div className="mt-4">
              <Button
                variant="warning"
                href="https://github.com/SpartanOpJod/Budget-Buddy"
                target="_blank"
                style={{ marginRight: "10px" }}
              >
                🚀 View GitHub Repository
              </Button>

              <Button
                variant="outline-light"
                href="https://github.com/SpartanOpJod/Budget-Buddy/blob/main/README.md"
                target="_blank"
              >
                📖 Read Documentation
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default About;