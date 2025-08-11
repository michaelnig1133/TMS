import * as React from 'react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

export default function CustomPagination({ currentPage, totalPages, handlePageChange }) {
  return (
    <Stack spacing={2} className="d-flex justify-content-center" // Add margin bottom for spacing
    sx={{
        display: 'flex',
        justifyContent: 'center', // Center horizontally
        alignItems: 'center', // Center vertically
        // Full viewport height
      }}>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={(event, page) => handlePageChange(page)} // Handle page change
        // Use outlined variant for the look
        color="primary" // Set color to primary
        siblingCount={1} // Number of sibling pages to show
        boundaryCount={1} // Number of boundary pages to show
        sx={{
          '& .MuiPaginationItem-root': {
            width: '35px', // Set width for each button
    height: '35px', // Set height for each button 
            borderRadius: '75%',
            border: '1px solid rgba(47, 163, 181, 0.2)', // Add a transparent border
            backgroundColor: 'transparent', // Transparent background
            color: 'black', // Default text color
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)', // Slight hover effect
            },
            '&.Mui-selected': {
              backgroundColor: 'rgb(40, 79, 117)', // Selected button background
              color: 'white', // Selected text color
            },
          },
        }}
      />
    </Stack>
  );
}