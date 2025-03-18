// frontend/src/pages/Process1Page.jsx

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Box, Button } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

const Process1Page = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <Container component="main" maxWidth="xl">
      <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/detailed-phase/${id}`)}
          sx={{
            mb: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "medium",
          }}
        >
          Quay lại
        </Button>
      </Box>
      <div>
        <h1>Process 1 Page</h1>
      </div>
    </Container>
  );
};

export default Process1Page;
