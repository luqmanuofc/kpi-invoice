import { Container, Typography, Box } from "@mui/material";

export default function BuyerPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Buyers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Buyer management page coming soon...
        </Typography>
      </Box>
    </Container>
  );
}
