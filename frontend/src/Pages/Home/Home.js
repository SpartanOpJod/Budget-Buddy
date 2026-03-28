import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import { Button, Modal, Form, Container } from "react-bootstrap";
// import loading from "../../assets/loader.gif";
import "./home.css";
import {
  addTransaction,
  getTransactions,
  parseTransactionTextAPI,
  predictCategoryAPI,
} from "../../utils/ApiRequest";
import httpClient from "../../utils/httpClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../../components/Spinner";
import TableData from "./TableData";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import BarChartIcon from "@mui/icons-material/BarChart";
import Analytics from "./Analytics";
import AIInsightsPanel from "./AIInsightsPanel";

const Home = () => {
  const navigate = useNavigate();

  const toastOptions = {
    position: "bottom-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
  };
  const [cUser, setcUser] = useState();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [frequency, setFrequency] = useState("7");
  const [type, setType] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [view, setView] = useState("table");
  const [isPredictingCategory, setIsPredictingCategory] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [naturalText, setNaturalText] = useState("");
  const [isParsingText, setIsParsingText] = useState(false);

  const handleStartChange = (date) => {
    setStartDate(date);
  };

  const handleEndChange = (date) => {
    setEndDate(date);
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    const avatarFunc = async () => {
      if (localStorage.getItem("user")) {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        if (user.isAvatarImageSet === false || user.avatarImage === "") {
          navigate("/setAvatar");
        }
        setcUser(user);
        setRefresh(true);
      } else {
        navigate("/login");
      }
    };

    avatarFunc();
  }, [navigate]);

  const [values, setValues] = useState({
    title: "",
    amount: "",
    description: "",
    category: "",
    date: "",
    transactionType: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    if (name === "category") {
      setCategoryTouched(Boolean(value));
    }
  };

  const handleChangeFrequency = (e) => {
    setFrequency(e.target.value);
  };

  const handleSetType = (e) => {
    setType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { title, amount, description, category, date, transactionType } =
      values;

    if (
      !title ||
      !amount ||
      !description ||
      !category ||
      !date ||
      !transactionType
    ) {
      toast.error("Please enter all the fields", toastOptions);
      return;
    }
    try {
      setLoading(true);
      const { data } = await httpClient.post(addTransaction, {
        title,
        amount,
        description,
        category,
        date,
        transactionType,
        userId: cUser._id,
      });

      if (data.success === true) {
        toast.success(data.message, toastOptions);
        handleClose();
        setValues({
          title: "",
          amount: "",
          description: "",
          category: "",
          date: "",
          transactionType: "",
        });
        setCategoryTouched(false);
        setNaturalText("");
        setRefresh(!refresh);
      } else {
        toast.error(data.message, toastOptions);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to add transaction",
        toastOptions
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setType("all");
    setStartDate(null);
    setEndDate(null);
    setFrequency("7");
  };

  const handleParseText = async () => {
    const text = naturalText.trim();
    if (!text) {
      toast.error("Enter a sentence to parse", toastOptions);
      return;
    }

    try {
      setIsParsingText(true);
      const { data } = await httpClient.post(parseTransactionTextAPI, { text });

      if (!data || typeof data !== "object") {
        toast.error("Could not parse transaction text", toastOptions);
        return;
      }

      const parsed = data;
      setValues((prev) => ({
        ...prev,
        title: parsed.title || prev.title,
        amount: parsed.amount || prev.amount,
        category: parsed.category || prev.category,
        transactionType: parsed.type || prev.transactionType,
        date: parsed.date || prev.date,
      }));
      setCategoryTouched(Boolean(parsed.category));
      toast.success("Transaction details parsed", toastOptions);
    } catch {
      toast.error("Failed to parse transaction text", toastOptions);
    } finally {
      setIsParsingText(false);
    }
  };

  useEffect(() => {
    const title = values.title?.trim();

    if (!title || categoryTouched) {
      setIsPredictingCategory(false);
      return undefined;
    }

    let ignore = false;
    const timeoutId = setTimeout(async () => {
      try {
        setIsPredictingCategory(true);
        const { data } = await httpClient.post(predictCategoryAPI, { title });

        if (!ignore && data?.success && data?.category) {
          setValues((prev) => ({ ...prev, category: data.category }));
        }
      } catch {
        // Silently ignore prediction failures to avoid blocking transaction creation.
      } finally {
        if (!ignore) {
          setIsPredictingCategory(false);
        }
      }
    }, 500);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [values.title, categoryTouched]);

    const generatePDF = (transactions) => {
  if (!transactions || transactions.length === 0) {
    toast.error("No transactions available to export!", toastOptions);
    return;
  }

  import("jspdf").then(jsPDF => {
    const doc = new jsPDF.jsPDF();
    doc.setFontSize(16);
    doc.text("Budget Buddy - Expense Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

    let y = 40;
    doc.text("Title", 20, y);
    doc.text("Amount", 70, y);
    doc.text("Type", 110, y);
    doc.text("Category", 140, y);
    y += 10;

    transactions.forEach((txn) => {
      doc.text(txn.title || "-", 20, y);
      doc.text(String(txn.amount || "-"), 70, y);
      doc.text(txn.transactionType || "-", 110, y);
      doc.text(txn.category || "-", 140, y);
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    let totalExpense = 0;
let totalCredit = 0;

transactions.forEach((txn) => {
  if (txn.transactionType === "expense") {
    totalExpense += Number(txn.amount);
  } else if (txn.transactionType === "credit") {
    totalCredit += Number(txn.amount);
  }
});

y += 10;
doc.setFontSize(13);
doc.text("Summary", 20, y);
y += 10;
doc.text(`Total Earned: ₹${totalCredit}`, 20, y);
y += 10;
doc.text(`Total Spent: ₹${totalExpense}`, 20, y);
y += 10;
doc.text(`Net Balance: ₹${totalCredit - totalExpense}`, 20, y);

doc.save("BudgetBuddy_Report.pdf");

  });
};


  useEffect(() => {

    const fetchAllTransactions = async () => {
      try {
        setLoading(true);
        if (!cUser?._id) {
          setLoading(false);
          return;
        }
        const { data } = await httpClient.post(getTransactions, {
          userId: cUser._id,
          frequency: frequency,
          startDate: startDate,
          endDate: endDate,
          type: type,
        });
  
        setTransactions(data.transactions);
  
        setLoading(false);
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Error fetching transactions",
          toastOptions
        );
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, [refresh, frequency, endDate, type, startDate]);

  const handleTableClick = (e) => {
    setView("table");
  };

  const handleChartClick = (e) => {
    setView("chart");
  };

  return (
    <>
      <Header />

      {loading ? (
        <>
          <Spinner />
        </>
      ) : (
        <>
          <Container
            style={{ position: "relative", zIndex: "2 !important" }}
            className="mt-3"
          >
            <div className="filterRow">
              <div className="text-white">
                <Form.Group className="mb-3" controlId="formSelectFrequency">
                  <Form.Label>Select Frequency</Form.Label>
                  <Form.Select
                    name="frequency"
                    value={frequency}
                    onChange={handleChangeFrequency}
                  >
                    <option value="7">Last Week</option>
                    <option value="30">Last Month</option>
                    <option value="365">Last Year</option>
                    <option value="custom">Custom</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="text-white type">
                <Form.Group className="mb-3" controlId="formSelectFrequency">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={type}
                    onChange={handleSetType}
                  >
                    <option value="all">All</option>
                    <option value="expense">Expense</option>
                    <option value="credit">Earned</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="text-white iconBtnBox">
                <FormatListBulletedIcon
                  sx={{ cursor: "pointer" }}
                  onClick={handleTableClick}
                  className={`${
                    view === "table" ? "iconActive" : "iconDeactive"
                  }`}
                />
                <BarChartIcon
                  sx={{ cursor: "pointer" }}
                  onClick={handleChartClick}
                  className={`${
                    view === "chart" ? "iconActive" : "iconDeactive"
                  }`}
                />
              </div>

              <div>
                <Button onClick={handleShow} className="addNew">
                  Add New
                </Button>
                <Button onClick={handleShow} className="mobileBtn">
                  +
                </Button>
                <Modal show={show} onHide={handleClose} centered>
                  <Modal.Header closeButton>
                    <Modal.Title>Add Transaction Details</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form>
                      <Form.Group className="mb-3" controlId="formNaturalText">
                        <Form.Label>Quick Add (Natural Language)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder='Example: "I spent 500 on groceries today"'
                          value={naturalText}
                          onChange={(e) => setNaturalText(e.target.value)}
                        />
                        <div className="mt-2">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={handleParseText}
                            disabled={isParsingText}
                          >
                            {isParsingText ? "Parsing..." : "Parse Text"}
                          </Button>
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formName">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          name="title"
                          type="text"
                          placeholder="Enter Transaction Name"
                          value={values.title}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formAmount">
                        <Form.Label>Amount</Form.Label>
                        <Form.Control
                          name="amount"
                          type="number"
                          placeholder="Enter your Amount"
                          value={values.amount}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formSelect">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          name="category"
                          value={values.category}
                          onChange={handleChange}
                        >
                          <option value="">Choose...</option>
                          <option value="Groceries">Groceries</option>
                          <option value="Rent">Rent</option>
                          <option value="Salary">Salary</option>
                          <option value="Tip">Tip</option>
                          <option value="Food">Food</option>
                          <option value="Medical">Medical</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Transportation">Transportation</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          {isPredictingCategory
                            ? "Predicting category from title..."
                            : "Category is auto-predicted from title. You can override it manually."}
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formDescription">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          type="text"
                          name="description"
                          placeholder="Enter Description"
                          value={values.description}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formSelect1">
                        <Form.Label>Transaction Type</Form.Label>
                        <Form.Select
                          name="transactionType"
                          value={values.transactionType}
                          onChange={handleChange}
                        >
                          <option value="">Choose...</option>
                          <option value="credit">Credit</option>
                          <option value="expense">Expense</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formDate">
                        <Form.Label>Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="date"
                          value={values.date}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      {/* Add more form inputs as needed */}
                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                      Close
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                      Submit
                    </Button>
                  </Modal.Footer>
                </Modal>
              </div>
            </div>
            <br style={{ color: "white" }}></br>

            {frequency === "custom" ? (
              <>
                <div className="date">
                  <div className="form-group">
                    <label htmlFor="startDate" className="text-white">
                      Start Date:
                    </label>
                    <div>
                      <DatePicker
                        selected={startDate}
                        onChange={handleStartChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate" className="text-white">
                      End Date:
                    </label>
                    <div>
                      <DatePicker
                        selected={endDate}
                        onChange={handleEndChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <></>
            )}

            <div className="containerBtn">
              <Button variant="primary" onClick={handleReset}>
                Reset Filter
              </Button>
              <div className="containerBtn mb-3 text-center">
            <Button
                  variant="success"
                  onClick={() => generatePDF(transactions)}
                   >
                    Download PDF Report
                    </Button>
              </div>

            </div>
            {view === "table" ? (
              <>
                <TableData data={transactions} user={cUser} />
              </>
            ) : (
              <>
                <Analytics transactions={transactions} user={cUser} />
              </>
            )}
            <AIInsightsPanel transactions={transactions} />
            <ToastContainer />
          </Container>
        </>
      )}
    </>
  );
};

export default Home;
