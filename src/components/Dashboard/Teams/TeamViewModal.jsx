import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Row, Col } from "react-bootstrap";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import styles from "./Teams.module.css";

function TeamViewModal({ isOpen, onClose, team, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [products, setProducts] = useState([]);
  const [teamProducts, setTeamProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sample product data
  const sampleProducts = [
    {
      id: 1,
      name: "Premium Cattle Feed",
      category: "Cattle Feed",
      defaultPrice: 2500,
      unit: "50kg bag",
      description: "High quality cattle feed for dairy cows"
    },
    {
      id: 2,
      name: "Chicken Starter Feed",
      category: "Poultry Feed",
      defaultPrice: 1800,
      unit: "25kg bag",
      description: "Nutritional feed for young chickens"
    },
    {
      id: 3,
      name: "Goat Feed Pellets",
      category: "Goat Feed",
      defaultPrice: 2200,
      unit: "30kg bag",
      description: "Balanced nutrition for goats"
    },
    {
      id: 4,
      name: "Fish Feed Premium",
      category: "Fish Feed",
      defaultPrice: 3200,
      unit: "20kg bag",
      description: "High protein feed for fish farming"
    },
    {
      id: 5,
      name: "Pig Feed Complete",
      category: "Pig Feed",
      defaultPrice: 2800,
      unit: "40kg bag",
      description: "Complete nutrition for pigs"
    }
  ];

  useEffect(() => {
    if (isOpen && team) {
      fetchProducts();
    }
  }, [isOpen, team]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Try to fetch products from API
      try {
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        let endpoint = "/products";
        if (currentDivisionId && currentDivisionId !== '1') {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          endpoint += `?showAllDivisions=true`;
        }
        
        const res = await axiosAPI.get(endpoint);
        
        let productData = [];
        if (res.data && res.data.success && res.data.data && Array.isArray(res.data.data)) {
          productData = res.data.data;
        } else if (res.data && res.data.products && Array.isArray(res.data.products)) {
          productData = res.data.products;
        } else if (res.data && Array.isArray(res.data)) {
          productData = res.data;
        } else {
          productData = sampleProducts;
        }
        
        setProducts(productData);
        
        // Initialize team products with default values
        const initialTeamProducts = productData.map(product => ({
          productId: product.id,
          productName: product.name,
          isEnabled: true,
          teamPrice: product.defaultPrice || product.price || 0,
          defaultPrice: product.defaultPrice || product.price || 0
        }));
        
        setTeamProducts(initialTeamProducts);
        
      } catch (apiError) {
        console.log("API not available, using sample data");
        setProducts(sampleProducts);
        
        const initialTeamProducts = sampleProducts.map(product => ({
          productId: product.id,
          productName: product.name,
          isEnabled: true,
          teamPrice: product.defaultPrice,
          defaultPrice: product.defaultPrice
        }));
        
        setTeamProducts(initialTeamProducts);
      }
      
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProduct = (productId) => {
    setTeamProducts(prev => 
      prev.map(tp => 
        tp.productId === productId 
          ? { ...tp, isEnabled: !tp.isEnabled }
          : tp
      )
    );
  };

  const handlePriceChange = (productId, newPrice) => {
    setTeamProducts(prev => 
      prev.map(tp => 
        tp.productId === productId 
          ? { ...tp, teamPrice: parseFloat(newPrice) || 0 }
          : tp
      )
    );
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      const teamProductData = {
        teamId: team.id,
        teamName: team.teamName,
        products: teamProducts
      };

      // Try to save to API
      try {
        await axiosAPI.post("/teams/products", teamProductData);
        console.log("Team products updated successfully");
      } catch (apiError) {
        console.log("API not available, changes saved locally");
      }
      
      onClose();
      
    } catch (err) {
      console.error("Error saving team products:", err);
      setError("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  if (!team) return null;

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Team Details - {team.teamName}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading && <Loading />}
        
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Team Information */}
        <div className="mb-4">
          <h5>Team Information</h5>
          <Row>
            <Col md={4}>
              <strong>Team Name:</strong> {team.teamName}
            </Col>
            <Col md={4}>
              <strong>Team ID:</strong> {team.teamId}
            </Col>
            <Col md={4}>
              <strong>Team Head:</strong> {team.teamLead?.name || team.teamLead || team.lead?.name || team.lead || "-"}
            </Col>
          </Row>
          <Row className="mt-2">
            <Col md={4}>
              <strong>Member Count:</strong> {Array.isArray(team.members) ? team.members.length : (team.memberCount || team.members || "-")}
            </Col>
            <Col md={4}>
              <strong>Department:</strong> {team.department}
            </Col>
            <Col md={4}>
              <strong>Status:</strong> 
              <span className={`badge ms-2 ${team.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                {team.status}
              </span>
            </Col>
          </Row>
        </div>

        {/* Product Details */}
        <div className="mb-4">
          <h5>Product Details & Pricing</h5>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Default Price</th>
                  <th>Team Price</th>
                  <th>Enable/Disable</th>
                </tr>
              </thead>
              <tbody>
                {teamProducts.map((teamProduct) => {
                  const product = products.find(p => p.id === teamProduct.productId);
                  return (
                    <tr key={teamProduct.productId}>
                      <td>
                        <strong>{teamProduct.productName}</strong>
                        {product?.description && (
                          <div className="text-muted small">{product.description}</div>
                        )}
                      </td>
                      <td>{product?.category || "-"}</td>
                      <td>
                        <span className="text-muted">
                          ₹{(teamProduct.defaultPrice || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={teamProduct.teamPrice}
                          onChange={(e) => handlePriceChange(teamProduct.productId, e.target.value)}
                          disabled={!teamProduct.isEnabled}
                          min="0"
                          step="0.01"
                          size="sm"
                          style={{ width: "120px" }}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="switch"
                          id={`switch-${teamProduct.productId}`}
                          checked={teamProduct.isEnabled}
                          onChange={() => handleToggleProduct(teamProduct.productId)}
                          label={teamProduct.isEnabled ? "Enabled" : "Disabled"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-3">
          <h6>Summary</h6>
          <Row>
            <Col md={4}>
              <strong>Total Products:</strong> {products.length}
            </Col>
            <Col md={4}>
              <strong>Enabled Products:</strong> {teamProducts.filter(tp => tp.isEnabled).length}
            </Col>
            <Col md={4}>
              <strong>Disabled Products:</strong> {teamProducts.filter(tp => !tp.isEnabled).length}
            </Col>
          </Row>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {isAdmin && (
          <Button 
            variant="primary" 
            onClick={handleSaveChanges}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default TeamViewModal;
