import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';
import ShowImage from './ShowImage';
import { Link } from 'react-router-dom'; 
import Form1 from './Form1';
import Edit from './edidata';
import { openDB } from 'idb';


// ...

// Define the database name, version, and upgrade callback
const dbPromise = openDB('deletedMedicalFormsDB', 1, {
  upgrade(db) {
    db.createObjectStore('deletedMedicalForms', { keyPath: 'id', autoIncrement: true });
  },
});

// ...





const calculateAge = (dob) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const MedicalRecordsTable = ({ medicalRecords, onAddClick, onSearch, setMedicalRecords }) => {
  const [open, setOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [open1,setOpen1]=useState(false)
  const [ids,setIDs]=useState('')
  const handleOpen1=(id)=>{
   
    setIDs(id)
    setOpen1(true)
  }
  const handleclose1=()=>{
    setOpen1(false)
  }

  
  const handleClickOpen = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setOpen(true);
  };
  const dialogStyle = {
    overflowX: 'hidden', // Hide the horizontal scrollbar
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleEdit = (id) => {
    // Add logic for handling edit action
    console.log(`Edit button clicked for entry with id: ${id}`);
  };

  // const handleDelete = async (id) => {
  //   try {
  //     // Send a DELETE request to the Flask endpoint with the medical record ID
  //     await axios.delete(`http://localhost:5000/deleteMedicalData/${id}`);
      
  //     // Update the state to remove the deleted record
  //     setMedicalRecords(medicalRecords.filter(entry => entry._id !== id));
  
  //     console.log(`Medical record with id ${id} deleted successfully`);
  //     window.location.reload()
  //   } catch (error) {
  //     console.error('Error deleting data:', error);
  //   }
  // };
  // ...
  const handleDelete = async (id) => {
    try {
      if (navigator.onLine) {
        // Online: Send a DELETE request to the server
        await axios.delete(`http://localhost:5000/deleteMedicalData/${id}`);
  
        // Update the state to remove the deleted record
        setMedicalRecords(medicalRecords.filter(entry => entry._id !== id));
  
        console.log(`Medical record with id ${id} deleted successfully`);
      } else {
        // Offline: Store the deleted record in a separate store in IndexedDB
        console.log('hi')
        console.log('Deleting record with id:', id);
  
        // Open the original object store ("medicalForms") and delete the record
        const db1 = await openDB('medicalFormDB', 1);
        const originalTransaction = db1.transaction('medicalForms', 'readwrite');
        const originalObjectStore = originalTransaction.objectStore('medicalForms');


  await originalObjectStore.delete(id);
  console.log('Deleted record from original object store with id:', id);


// // Fetch the updated records after deletion
// const updatedRecords = await originalObjectStore.getAll();

// // Update the state with the updated records
// setMedicalRecords(updatedRecords);

// Log whether the transaction is done
console.log('Transaction done:', await originalTransaction.done);

  
        // Fetch the updated records after deletion
        // const dbPromise = openDB('deletedMedicalFormsDB', 1, {
        //   upgrade(db) {
        //     db.createObjectStore('deletedMedicalForms', { keyPath: '_id' });
        //   },
        // });

        const deletedRecord = medicalRecords.find(entry => entry._id === id);

        const db = await dbPromise
  
        // Store the deleted record in the new object store ("deletedMedicalForms")
        const deletedTransaction = db.transaction('deletedMedicalForms', 'readwrite');
const deletedObjectStore = deletedTransaction.objectStore('deletedMedicalForms');

// Check if the record with the given key already exists
const existingRecord = await deletedObjectStore.get(id);

// Add the record only if it doesn't already exist
if (!existingRecord) {
  await deletedObjectStore.add(deletedRecord);
  console.log('added');
} else {
  console.log('Record with this ID already exists in deletedMedicalForms object store');
}

  
  
        // Wait for the transaction to complete
        await deletedTransaction.done;
       
        // Log the server response
        console.log(`Medical record with id ${id} deleted`);
      }
  
      // Attempt to sync with the server
      await checkConnectivityAndSync();
  
      console.log('After attempting to delete');
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };
  




  // Function to sync deleted records with the server
  const syncDeletedRecords = async () => {
    const db = await openDB('deletedMedicalFormsDB', 1);
    const tx = db.transaction('deletedMedicalForms', 'readwrite');
    const deletedObjectStore = tx.objectStore('deletedMedicalForms');
  
  
      // const deletedRecords = await deletedObjectStore.getAll();
      const deletedRecordsBeforeSync = await deletedObjectStore.getAll();
      console.log('Deleted records before sync:', deletedRecordsBeforeSync);
  try{
      // Loop through deleted records and sync with the server
      for (const { id } of deletedRecordsBeforeSync) {
        try {
          
          const response = await axios.delete(`http://localhost:5000/deleteMedicalData/${id}`);
          console.log(`Synced deleted record with id ${id} with the server`,response.data);
        } catch (error) {
          console.log({id})
          console.error(`Error syncing deleted record with id ${id}:`, error);
        }
      }
  
      // Clear the local deleted records after successful sync
      // await tx.objectStore('deletedMedicalForms').clear();
  
        await tx.complete;
      
      const updatedTx = db.transaction('deletedMedicalForms', 'readwrite');
      const updatedDeletedObjectStore = updatedTx.objectStore('deletedMedicalForms');
       await updatedDeletedObjectStore.clear();
      const deletedRecordsAfterSync = await updatedDeletedObjectStore.getAll();
      console.log('Deleted records after sync:', deletedRecordsAfterSync);
  
      console.log('Local deleted records cleared after successful sync');
    } catch (error) {
      console.error('Error syncing deleted records:', error);
    } finally {
      // Make sure to complete the transaction
      // await tx.done;
    }
  };
  

// Function to check connectivity and trigger sync if online
const checkConnectivityAndSync = async () => {
  try {
    if (navigator.onLine) {
      // If online, sync deleted records with the server
      await syncDeletedRecords();
    }
  } catch (error) {
    console.error('Error checking connectivity and syncing:', error);
  }
};

// Call this function whenever the application is online
// For example, you can call it when the application starts or when it detects a change in network status.
checkConnectivityAndSync();

  
  return (
    <Paper elevation={3} style={{ padding: '2%', marginBottom: '2%', overflowX: 'auto' }}>
      <Toolbar style={{ flexWrap: 'wrap' }}>
        <TextField
          id="search"
          label="Search"
          type="search"
          variant="outlined"
          size="small"
          style={{ width: '100%', marginBottom: '8px' }}
          onChange={(e) => onSearch(e.target.value)}
        />
        <IconButton
          type="submit"
          aria-label="search"
          style={{ '@media (maxWidth: 600px)': { display: 'none' } }}
 
        >
          <SearchIcon />
        </IconButton>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Link to="/Form1" style={{ textDecoration: 'none' }}>
          <Button variant="contained" color="primary" style={{ width: '100%' }}>
            Add Data
          </Button>
        </Link>
      </div>
      </Toolbar>
      <TableContainer >
        <Table style={{ tableLayout: 'auto' }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>BMI</TableCell>
              <TableCell>Disease</TableCell>
              <TableCell>Submitted Date</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {medicalRecords.map((entry, index) => (
          <TableRow key={entry.data ? entry.data._id?.['$oid'] : entry._id?.['$oid']} style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
            <TableCell>{`${entry.data ? entry.data.firstName : entry.firstName} ${entry.data ? entry.data.lastName : entry.lastName}`}</TableCell>
            <TableCell>{entry.data ? entry.data.email : entry.email}</TableCell>
            <TableCell>{entry.data ? calculateAge(entry.data.dob) : calculateAge(entry.dob)}</TableCell>
            <TableCell>{entry.data ? entry.data.phoneNumber : entry.phoneNumber}</TableCell>
            <TableCell>{entry.data ? entry.data.bmi : entry.bmi}</TableCell>
            <TableCell>{entry.data ? (entry.data.disease ? entry.data.disease.join(' ') : '') : (entry.disease ? entry.disease.join(' ') : '')}</TableCell>
            <TableCell>
            <TableCell>
            {entry.data && (entry.data.createdAt && entry.data.createdAt.$date || entry.data.timestamp)
  ? new Date(entry.data.createdAt && entry.data.createdAt.$date || entry.data.timestamp).toLocaleString()
  : (entry.createdAt && entry.createdAt.$date
    ? new Date(entry.createdAt.$date).toLocaleString()
    : '')
}

</TableCell>

            </TableCell>
                
                <TableCell>
                  <React.Fragment>
                    <Button variant="outlined" onClick={() => handleClickOpen(entry.fileUrl)}>
                      SHOW IMAGE
                    </Button>
                    <BootstrapDialog
                      onClose={handleClose}
                      aria-labelledby="customized-dialog-title"
                      open={open}
                    >
                      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                        Modal title
                      </DialogTitle>
                      <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                          position: 'absolute',
                          right: 8,
                          top: 8,
                          color: (theme) => theme.palette.grey[500],
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" responsive>
                        <ShowImage imageUrl={selectedImageUrl} open={open} handleClose={handleClose} />
                      </Dialog> 
                      <DialogActions>
                        <Button autoFocus onClick={handleClose}>
                          Save changes
                        </Button>
                      </DialogActions>
                    </BootstrapDialog>
                  </React.Fragment>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex' }}>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        if (navigator.onLine) {
                          handleOpen1(entry._id['$oid']);
                        } else {
                          handleOpen1(entry._id);
                        }
                      }}
                      
                      startIcon={<EditNoteIcon />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        if (navigator.onLine) {
                          handleDelete(entry._id['$oid']);
                        } else {
                          handleDelete(entry._id);
                        }
                      }}
                      startIcon={<DeleteIcon />}
                      style={{ marginLeft: '8px' }}
                    >
                      Delete
                    </Button>
                  </div>

                  <Dialog open={open1} onClose={handleclose1} fullWidth maxWidth="md" PaperProps={{ style: { marginTop: '-10px' } }}  style={dialogStyle}>
  <DialogContent>
    <Edit id={ids} />
  </DialogContent>
</Dialog>
                 
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
     
    </Paper>
  );
};

const GetData = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  
  const [newData, setNewData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    phoneNumber: '',
    bmi: '',
    disease: '',
    fileUrl: '',
  });
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (navigator.onLine) {
          console.log('Before axios.get');



          const response = await axios.get('http://localhost:5000/getMedicalData');
          console.log('After axios.get', response);
          setMedicalRecords(response.data);

          // Update data in IndexedDB
          const db = await openDB('medicalFormDB', 1);
          const tx = db.transaction('medicalForms', 'readwrite');
          const store = tx.objectStore('medicalForms');

          // Clear existing data and add new data
          await store.clear();
          response.data.forEach(async (record) => {
            await store.add({ id: record._id['$oid'], data: record });
          });
        } else {
          // Fetch data from IndexedDB when offline
          const db = await openDB('medicalFormDB', 1);
          const indexedDBRecords = await db.getAll('medicalForms');
          setMedicalRecords(indexedDBRecords);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [searchTerm, setMedicalRecords]);

  
  
  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/searchMedicalData?term=${searchTerm}`);
      setMedicalRecords(response.data);
    } catch (error) {
      console.error('Error searching data:', error);
    }
  };

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };
  const handleOnline = async () => {
    // Check if there is data in IndexedDB
    const db = await openDB('medicalFormDB', 1);
    const indexedDBRecords = await db.getAll('medicalForms');
  
    console.log('online');
    if (indexedDBRecords.length > 0) {
      try {
        // Fetch existing data from MongoDB
        const response = await axios.get('http://localhost:5000/getAllMedicalForms');
        const existingMongoDBData = response.data; // Assuming the actual data is in response.data
  
        if (Array.isArray(existingMongoDBData)) {
          // Filter records that don't have a matching firstname and lastname in MongoDB
          const newDataForMongoDB = indexedDBRecords.filter((indexedDBRecord) => {
            return !existingMongoDBData.some((mongoDBRecord) =>
              mongoDBRecord.firstname === indexedDBRecord.firstname &&
              mongoDBRecord.lastname === indexedDBRecord.lastname
            );
          });
  
          if (newDataForMongoDB.length > 0) {
            // Delete data from MongoDB
            // await axios.post('http://localhost:5000/deleteAllMedicalForms');
            // console.log('Deleted old data from MongoDB');
  
            // Send only the new data to the server
            await axios.post('http://localhost:5000/medicalForm', newDataForMongoDB, { timeout: 5000 });
            console.log('Added new data to MongoDB');
          } else {
            console.log('No new data to send to MongoDB');
          }
  
          console.log('Data synchronization complete');
        } else {
          console.error('Invalid response format from MongoDB:', existingMongoDBData);
        }
      } catch (error) {
        console.error('Error during data synchronization:', error);
      }
    }
  };
  
  window.addEventListener('online', handleOnline);

  // const handleAddData = async () => {
  //   try {
  //     const response = await axios.post('http://localhost:5000/addMedicalData', newData);
  //     setMedicalRecords([...medicalRecords, response.data]);
  //     handleCloseAddDialog();
  //   } catch (error) {
  //     console.error('Error adding data:', error);
  //   }
  // };
  

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" style={{ flexGrow: 1, fontSize: '1.5rem','@media (max-width: 600px)': { fontSize: '1rem' } }}>
            Medical Records
          </Typography>
        </Toolbar>
      </AppBar>
      <MedicalRecordsTable
        medicalRecords={medicalRecords}
        onAddClick={handleOpenAddDialog}
        onSearch={handleSearch}
        setMedicalRecords={setMedicalRecords}
      />
    </div>
  );
};

export default GetData;