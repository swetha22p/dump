import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AWS from 'aws-sdk';
import { useState , useEffect } from 'react';
import { openDB } from 'idb'; 



const minioEndpoint = 'http://10.8.0.13:9000';
const accessKey = 'minioadmin';
const secretKey = 'minioadmin';
const bucketName = 'test';

AWS.config.update({
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
  endpoint: minioEndpoint,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

const s3 = new AWS.S3();

const minioUploader = async (file, fileName) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: file,
    ContentType: file.type,
  };

  try {
    await s3.upload(params).promise();
  } catch (error) {
    console.error('Error uploading to MinIO:', error);
    throw error;
  }
};


const dbPromise = openDB('medicalFormDB', 1, {
  upgrade(db) {
    db.createObjectStore('medicalForms', { keyPath: '_id', autoIncrement: true });
    
  },
});
const syncDataToMongoDB = async (formData, file) => {
  try {
    console.log('Sending data to MongoDB:', formData);

    // If there is a file, upload it to MinIO and include the file URL in formData
    let fileUrl = '';
    if (file) {
      const fileName = `medical_form_${Date.now()}_${file.name}`;
      await minioUploader(file, fileName);
      fileUrl = `${minioEndpoint}/${bucketName}/${fileName}`;
    }

    const response = await axios.post('http://localhost:5000/medicalForm', {
      ...formData,
      fileUrl,
    });

    console.log('Data synced to MongoDB:', response.data);
  } catch (error) {
    console.error('Error syncing data to MongoDB:', error);
  }
};




const diseases = ['Diabetes', 'Heart disease', 'Asthma', 'Cancer'];

const Form1 = () => {
  const [medicalFormData, setMedicalFormData] = useState({});
  const [file, setFile] = useState(null);
  const [offlineStorageEnabled, setOfflineStorageEnabled] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  useEffect(() => {
    // Check if the navigator is online
    setOfflineStorageEnabled(!navigator.onLine);

    // Add event listeners to track online/offline status changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const handleOnline = async () => {
    setOfflineStorageEnabled(false);
  
    const db = await dbPromise;
    const offlineForms = await db.getAll('medicalForms');
  
    if (offlineForms.length > 0) {
      for (const { data, file ,id} of offlineForms) {
        try {
          // Perform the necessary processing and sync to MongoDB
          await syncDataToMongoDB(data, file);
  
          // Remove the synced data from IndexedDB
          console.log('Deleting record with id:', id);
          await db.delete('medicalForms', id);
          console.log('Record deleted successfully');
        } catch (error) {
          console.error('Error deleting record:', error);
        }
      }
    }
  
    console.log('Offline data synced to MongoDB');
  };
  
    // You can trigger the submission of offline data to the server here


  const handleOffline = () => {
    setOfflineStorageEnabled(true);
  };
  
 
  
  const handleChange = (event) => {
    const { name, value } = event.target;
  
    let updatedMedicalFormData;
  
    if (name === 'height' || name === 'weight') {
      const updatedHeight = name === 'height' ? parseFloat(value) : parseFloat(medicalFormData.height) || 0;
      const updatedWeight = name === 'weight' ? parseFloat(value) : parseFloat(medicalFormData.weight) || 0;
      const bmi = updatedWeight / ((updatedHeight / 100) ** 2);
  
      updatedMedicalFormData = {
        ...medicalFormData,
        [name]: value,
        height: updatedHeight,
        weight: updatedWeight,
        bmi: isNaN(bmi) ? '' : bmi.toFixed(2),
      };
    } 
    else if (name === 'phoneNumber') {
      // Remove non-numeric characters
      const numericValue = value.replace(/\D/g, '');
    
      // Ensure it has at most 10 digits
      const validPhoneNumber = /^\d{0,10}$/.test(numericValue);
    
      if (validPhoneNumber) {
        updatedMedicalFormData = {
          ...medicalFormData,
          [name]: numericValue,
        };
      } else {
        // Handle invalid phone number input (e.g., display an error message)
        console.error('Invalid phone number input');
        return;
      }
    }
    else if (name === 'firstName' || name === 'lastName') {
      
      const alphabeticValue = value.replace(/[^A-Za-z]/g, ''); 
      updatedMedicalFormData = {
        ...medicalFormData,
        [name]: alphabeticValue,
      };
    }
    else if (name === 'disease') {
      const updatedDiseases = Array.isArray(value) ? value : medicalFormData.disease || [];
  
      updatedMedicalFormData = {
        ...medicalFormData,
        disease: updatedDiseases,
      };
    }
    else {
      updatedMedicalFormData = {
        ...medicalFormData,
        [name]: value,
      };
    }
  
    setMedicalFormData(updatedMedicalFormData);
  };
  

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

 

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const timestamp = new Date().getTime();
      if (offlineStorageEnabled) {
        // Store data in IndexedDB if offline

        
        const db = await dbPromise;
        await db.add('medicalForms', { data: { ...medicalFormData , timestamp}, file });
        
        
        console.log('Data saved to IndexedDB');
        setSuccessMessage('Form submitted successfully (offline)');
      } else {
      
        if (file) {
          const fileName = `medical_form_${timestamp}_${file.name}`;
          await minioUploader(file, fileName);

          const response = await axios.post('http://localhost:5000/medicalForm', {
            ...medicalFormData,
            fileUrl: `${minioEndpoint}/${bucketName}/${fileName}`,
          });

          console.log('Response:', response.data);
          
          setMedicalFormData({});
          setFile(null);
          // if (navigator.onLine) {
          //   syncDataToMongoDB();
          // }
        } else {
          console.error('No file selected.');
        }
      }
      setMedicalFormData({});
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage('Form submission failed');
    }
  };
  
  


  return (
    <Container component="main" maxWidth="md">
    <Typography variant="h3" align="center" gutterBottom>
      Basic Medical Form
    </Typography>

    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            required
            id="firstName"
            label="First Name"
            name="firstName"
            value={medicalFormData.firstName || ''}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            required
            id="lastName"
            label="Last Name"
            name="lastName"
            value={medicalFormData.lastName || ''}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            required
            id="phoneNumber"
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            value={medicalFormData.phoneNumber || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    variant="outlined"
    margin="normal"
    required
    id="email"
    label="Email Address"
    name="email"
    type="email"  
    value={medicalFormData.email || ''}
    onChange={handleChange}
  />
</Grid>
<Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              margin="normal"
              required
              id="dob"
              label="Date of Birth"
              name="dob"
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
              value={medicalFormData.dob || ''}
              onChange={handleChange}
            />
          </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="gender">Gender</InputLabel>
            <Select
              label="Gender"
              name="gender"
              value={medicalFormData.gender || ''}
              onChange={handleChange}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel htmlFor="disease">Disease</InputLabel>
              <Select
                label="Disease"
                name="disease"
                multiple
                value={medicalFormData.disease || []}
                onChange={handleChange}
              >
                {diseases.map((disease) => (
                  <MenuItem key={disease} value={disease}>
                    {disease}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

        

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            required
            id="height"
            label="Height (cm)"
            name="height"
            type="number"
            value={medicalFormData.height || ''}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            required
            id="weight"
            label="Weight (kg)"
            name="weight"
            type="number"
            value={medicalFormData.weight || ''}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            required
            id="bmi"
            label="BMI"
            name="bmi"
            type="number"
            size="small"
            value={medicalFormData.bmi || ''}
            onChange={handleChange}
            InputProps={{
              readOnly: true,
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <input type="file" name="file" onChange={handleFileChange} />
        </Grid> 

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            Submit
          </Button>
          
        </Grid>
      </Grid>
    </form>
  </Container>
  );
};


export default Form1;
