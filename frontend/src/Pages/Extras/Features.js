import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { BarChart2, ShieldCheck, Download, Layers, Zap } from "lucide-react";

const Features = () => {
  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "white",
        minHeight: "100vh",
        padding: "60px 0",
      }}
    >
      <Container>
        <h1
          className="text-center mb-4"
          style={{
            color: "#ffcc00",
            textShadow: "0px 0px 10px #ffcc00",
            fontWeight: "bold",
          }}
        >
          Features That Make Budget Buddy Stand Out
        </h1>

        <p
          className="text-center mb-5"
          style={{ color: "#ccc", fontSize: "18px", maxWidth: "800px", margin: "auto" }}
        >
          Budget Buddy isn’t just another expense tracker — it’s your personal
          financial assistant that helps you manage your money effortlessly,
          visualize your spending, and take control of your goals.
        </p>

        <Row className="g-4 mb-5">
          <Col md={4}>
            <Card
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "25px",
                borderRadius: "15px",
                textAlign: "center",
              }}
            >
              <BarChart2 size={40} color="#ffcc00" />
              <h4 className="mt-3">Smart Analytics</h4>
              <p style={{ color: "#bbb" }}>
                Get detailed insights into your income, expenses, and spending
                habits with clean visual charts and reports.
              </p>
            </Card>
          </Col>

          <Col md={4}>
            <Card
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "25px",
                borderRadius: "15px",
                textAlign: "center",
              }}
            >
              <ShieldCheck size={40} color="#ffcc00" />
              <h4 className="mt-3">Secure Login System</h4>
              <p style={{ color: "#bbb" }}>
                Your data stays encrypted and private with secure authentication
                and password hashing.
              </p>
            </Card>
          </Col>

          <Col md={4}>
            <Card
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "25px",
                borderRadius: "15px",
                textAlign: "center",
              }}
            >
              <Download size={40} color="#ffcc00" />
              <h4 className="mt-3">Download Reports</h4>
              <p style={{ color: "#bbb" }}>
                Instantly generate and download expense summaries in PDF for
                personal or business tracking.
              </p>
            </Card>
          </Col>

          <Col md={4}>
            <Card
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "25px",
                borderRadius: "15px",
                textAlign: "center",
              }}
            >
              <Layers size={40} color="#ffcc00" />
              <h4 className="mt-3">Multi-Category Tracking</h4>
              <p style={{ color: "#bbb" }}>
                Categorize every expense and see where your money goes with easy
                filtering options.
              </p>
            </Card>
          </Col>

          <Col md={4}>
            <Card
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "25px",
                borderRadius: "15px",
                textAlign: "center",
              }}
            >
              <Zap size={40} color="#ffcc00" />
              <h4 className="mt-3">Fast & Responsive</h4>
              <p style={{ color: "#bbb" }}>
                Built with React and Bootstrap, ensuring smooth performance on
                all screen sizes.
              </p>
            </Card>
          </Col>
        </Row>

        <h2
  className="text-center mb-4"
  style={{ color: "#ffcc00", fontWeight: "bold" }}
>
  Sneak Peek of Budget Buddy in Action
</h2>

<Row className="text-center justify-content-center">
  <Col md={5} className="mb-4">
    <img
      src="/assests/dashboard.png"
      alt="Dashboard Preview"
      className="img-fluid rounded shadow-lg mb-4"
      style={{
        maxWidth: "90%",
        border: "2px solid #ffcc00",
        borderRadius: "10px",
      }}
    />
  </Col>
  <Col md={5} className="mb-4">
    <img
      src="/assests/analytics.png"
      alt="Analytics Preview"
      className="img-fluid rounded shadow-lg mb-4"
      style={{
        maxWidth: "90%",
        border: "2px solid #ffcc00",
        borderRadius: "10px",
        height:"195px",
      }}
    />
  </Col>
</Row>

      </Container>
    </div>
  );
};

export default Features;
