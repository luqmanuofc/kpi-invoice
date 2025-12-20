import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const LOGIN_PASSWORD = import.meta.env.VITE_APP_PASSWORD;
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN;

if (!LOGIN_PASSWORD) {
  throw new Error("VITE_APP_PASSWORD environment variable is required but not set");
}

if (!AUTH_TOKEN) {
  throw new Error("VITE_AUTH_TOKEN environment variable is required but not set");
}

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === LOGIN_PASSWORD) {
      localStorage.setItem("authToken", AUTH_TOKEN);
      navigate("/");
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 400,
          width: "100%",
          margin: 2,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Invoice App Login
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            type={showPassword ? "text" : "password"}
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            fullWidth
            margin="normal"
            autoFocus
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
          >
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
