// ErrorLayout.jsx
import { Box, Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const ErrorLayout = ({ title, subtitle, description, icon, statusCode }) => {
  const navigate = useNavigate();

  return (
    <Container
      maxWidth="md"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          gap: 4,
          py: 8,
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: { xs: "200px", md: "300px" },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              backgroundColor: "#10637422",
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              fontSize: { xs: "5rem", md: "7rem" },
              fontWeight: "bold",
              color: "#181E4B",
              zIndex: 1,
            }}
          >
            {statusCode}
          </Box>
        </Box>

        <Box sx={{ maxWidth: "500px" }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              color: "#181E4B",
              mb: 1,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 600,
              color: "#ec931e",
              mb: 2,
            }}
          >
            {subtitle}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#106374",
              mb: 3,
            }}
          >
            {description}
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => navigate(-1)}
              sx={{
                bgcolor: "#181E4B",
                "&:hover": { bgcolor: "#0f142e" },
              }}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate("/")}
              sx={{
                bgcolor: "#ec931e",
                "&:hover": { bgcolor: "#d68215" },
              }}
            >
              Home Page
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default ErrorLayout;
