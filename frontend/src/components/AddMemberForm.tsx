import React, { useState } from "react";
import { Card, Form, Button, Spinner, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { validateMemberData } from "../utils/validationHelpers";
import type { MemberFormData } from '../types/contract';

interface AddMemberFormProps {
  onAddMember: (memberData: MemberFormData) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

interface FormState {
  address: string;
  x500Name: string;
  certSerialHex: string;
  platformVersion: string;
  host: string;
  port: string;
}

const AddMemberForm: React.FC<AddMemberFormProps> = ({ onAddMember, loading }) => {
  const [formData, setFormData] = useState<FormState>({
    address: "",
    x500Name: "",
    certSerialHex: "",
    platformVersion: "",
    host: "",
    port: "",
  });
  const [validated, setValidated] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);

    const validation = validateMemberData({
      address: formData.address,
      x500Name: formData.x500Name,
      certSerialHex: formData.certSerialHex,
      platformVersion: formData.platformVersion,
      host: formData.host,
      port: formData.port
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }

    setValidationErrors({});

    const data: MemberFormData = {
      address: formData.address.trim(),
      x500Name: formData.x500Name.trim(),
      certSerialHex: validation.sanitizedCertSerial || formData.certSerialHex,
      platformVersion: parseInt(formData.platformVersion, 10),
      host: formData.host.trim(),
      port: parseInt(formData.port, 10)
    };

    const result = await onAddMember(data);

    if (result && result.success) {
      setFormData({
        address: "",
        x500Name: "",
        certSerialHex: "0x1732382838913",
        platformVersion: "12",
        host: "contour.p2p.app.contournetwork.io",
        port: "10030",
      });
      setValidated(false);
      setValidationErrors({});
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header as="h5">Add New Member</Card.Header>
      <Card.Body>
        {Object.keys(validationErrors).length > 0 && (
          <Alert variant="danger" className="mb-3">
            <Alert.Heading>Validation Errors</Alert.Heading>
            <ul className="mb-0">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>
                  <strong>{field}:</strong> {error}
                </li>
              ))}
            </ul>
          </Alert>
        )}
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Member Address</Form.Label>
            <Form.Control
              type="text"
              name="address"
              placeholder="0x..."
              value={formData.address}
              onChange={handleChange}
              required
              pattern="^0x[a-fA-F0-9]{40}$"
            />
            <Form.Control.Feedback type="invalid">
              Please provide a valid Ethereum address.
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              The Ethereum address of the member
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>X.500 Distinguished Name</Form.Label>
            <Form.Control
              type="text"
              name="x500Name"
              placeholder="CN=Node1,O=XDC,C=SG"
              value={formData.x500Name}
              onChange={handleChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please provide a X.500 distinguished name.
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              X.500 name format: CN=CommonName,O=Organization,C=Country
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Certificate Serial (Hex)</Form.Label>
            <Form.Control
              type="text"
              name="certSerialHex"
              placeholder="0x1234567890abcdef"
              value={formData.certSerialHex}
              onChange={handleChange}
              required
              isInvalid={!!validationErrors.certSerialHex}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.certSerialHex || "Please provide the X.509 certificate serial number in hex format."}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              X.509 certificate serial number in hex format (e.g., 0x1234...). Used for PKI integration and certificate revocation.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Platform Version</Form.Label>
            <Form.Control
              type="number"
              name="platformVersion"
              placeholder="Enter platform version"
              value={formData.platformVersion}
              onChange={handleChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please provide a platform version.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Host</Form.Label>
            <Form.Control
              type="text"
              name="host"
              placeholder="Enter host address"
              value={formData.host}
              onChange={handleChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please provide a host address.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Port</Form.Label>
            <Form.Control
              type="number"
              name="port"
              placeholder="Enter port number"
              value={formData.port}
              onChange={handleChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please provide a port number.
            </Form.Control.Feedback>
          </Form.Group>

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Adding...
              </>
            ) : (
              "Add Member"
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AddMemberForm;
