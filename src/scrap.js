// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import Box from '@mui/material/Box';
// import TextField from '@mui/material/TextField';
// import Button from '@mui/material/Button';
// import FormControl from '@mui/material/FormControl';
// import Grid from '@mui/material/Grid';
// import Checkbox from '@mui/material/Checkbox';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import TextareaAutosize from '@mui/material/TextareaAutosize';
// import Select from '@mui/material/Select';
// import MenuItem from '@mui/material/MenuItem';
// import InputLabel from '@mui/material/InputLabel';
// import Container from '@mui/material/Container';
// import Typography from '@mui/material/Typography';
// import AWS from 'aws-sdk';
// import { openDB } from 'idb';

// const minioEndpoint = 'http://10.8.0.15:9000';
// const accessKey = 'minioadmin';
// const secretKey = 'Minio@0710';
// const bucketName = 'rcts-audio-data-ncert';

// AWS.config.update({
//   accessKeyId: accessKey,
//   secretAccessKey: secretKey,
//   endpoint: minioEndpoint,
//   s3ForcePathStyle: true,
//   signatureVersion: 'v4',
// });

// const s3 = new AWS.S3();

// const minioUploader = async (file, fileName) => {
//   const params = {
//     Bucket: bucketName,
//     Key: fileName,
//     Body: file,
//     ContentType: file.type,
//   };

//   try {
//     await s3.upload(params).promise();
//   } catch (error) {
//     console.error('Error uploading to MinIO:', error);
//     throw error;
//   }
// };
// const diseases = ['Diabetes', 'Heart disease', 'Asthma', 'Cancer'];

// const Edit = (props) => {
//   const [medicalFormData, setMedicalFormData] = useState({});
//   const [file, setFile] = useState(null);
//   const id=props.id
//   console.log(id);
  
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         if (navigator.onLine) {
//           // Online: Fetch data from MongoDB
//           const response = await axios.get(`http://localhost:5000/getMedicalData/${id}`);
//           const { disease, ...otherData } = response.data;

//           // Initialize the state with the data received from the backend
//           setMedicalFormData({
//             ...otherData,
//             disease: disease || [], // Ensure disease is an array even if it's null
//           });
//         } else {
//           // Offline: Fetch data from IndexedDB (medicalformsdb)
//           const db = await openDB('medicalFormDB', 1);
//           const tx = db.transaction('medicalForms', 'readonly');
//           const store = tx.objectStore('medicalForms');

//           const offlineData = await store.get(id);

//           if (offlineData) {
//             const { disease, ...otherData } = offlineData;

//             // Initialize the state with the data received from IndexedDB
//             setMedicalFormData({
//               ...otherData,
//               disease: disease || [], // Ensure disease is an array even if it's null
//             });
//           } else {
//             console.log(`Data for ID ${id} not found in IndexedDB`);
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     fetchData();
//   }, [id]);
  
//   const handleChange = (event) => {
//     const { name, value, type, checked } = event.target;
//     let updatedMedicalFormData;
    
//     if (type === 'number') {
//       const updatedHeight = name === 'height' ? parseFloat(value) : parseFloat(medicalFormData.height) || 0;
//       const updatedWeight = name === 'weight' ? parseFloat(value) : parseFloat(medicalFormData.weight) || 0;
//       const bmi = updatedWeight / ((updatedHeight / 100) ** 2);
//       updatedMedicalFormData = {
//         ...medicalFormData,
//         [name]: value,
//         height: updatedHeight,
//         weight: updatedWeight,
//         bmi: isNaN(bmi) ? '' : bmi.toFixed(2),
//       };
//     } else if (name === 'phoneNumber') {
      
//       const numericValue = value.replace(/\D/g, '');
      
//       const validPhoneNumber = /^\d{0,10}$/.test(numericValue);
      
//       if (validPhoneNumber) {
//         updatedMedicalFormData = {
//           ...medicalFormData,
//           [name]: numericValue,
//         };
//       } else {
        
//         console.error('Invalid phone number input');
//         return;
//       }
//     } else if (name === 'firstName' || name === 'lastName') {
//       const alphabeticValue = value.replace(/[^A-Za-z]/g, '');
      
//       updatedMedicalFormData = {
//         ...medicalFormData,
//         [name]: alphabeticValue,
//       };
//     } else if (name === 'disease') {
//       const updatedDiseases = Array.isArray(value) ? value : medicalFormData.disease || [];
  
//       updatedMedicalFormData = {
//         ...medicalFormData,
//         disease: updatedDiseases,
//       };
//     }
//     else {
//       updatedMedicalFormData = {
//         ...medicalFormData,
//         [name]: value,
//       };
//     }
  
//     setMedicalFormData(updatedMedicalFormData);
//   };
  

//   const handleFileChange = (event) => {
//     const selectedFile = event.target.files[0];
//     setFile(selectedFile);
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
  
//   //   try {
//   //     if (file) {
//   //       const fileName = `medical_form_${Date.now()}_${file.name}`;
//   //       await minioUploader(file, fileName);
  
//   //       const { _id, ...formDataWithoutId } = medicalFormData;
  
//   //       const response = await axios.put(`http://localhost:5000/updateMedicalData/${id}`, {
//   //         ...formDataWithoutId,
//   //         fileUrl: `${minioEndpoint}/${bucketName}/${fileName}`,
//   //       });
  
//   //       console.log('Response:', response.data);
//   //       setMedicalFormData({});
//   //       setFile(null);
//   //       window.location.reload()
//   //     } else {
//   //       console.error('No file selected.');
//   //     }
//   //   } catch (error) {
//   //     console.error('Error:', error);
//   //   }
//   // };
//   try {
//     let fileName;
//     if (navigator.onLine) {
//       // Online: Upload file and update data in MongoDB
//       if (file) {
//         fileName = `medical_form_${Date.now()}_${file.name}`;
//         await minioUploader(file, fileName);

//         const { _id, ...formDataWithoutId } = medicalFormData;

//         const response = await axios.put(`http://localhost:5000/updateMedicalData/${id}`, {
//           ...formDataWithoutId,
//           fileUrl: `${minioEndpoint}/${bucketName}/${fileName}`,
//         });

//         console.log('Response:', response.data);
//         setMedicalFormData({});
//         setFile(null);
//         window.location.reload();
//       } else {
//         console.error('No file selected.');
//       }
//     } else {
//       // Offline: Update data in IndexedDB
//       const db = await openDB('medicalFormDB', 1);
//       const tx = db.transaction('medicalForms', 'readwrite');
//       const store = tx.objectStore('medicalForms');

//       // Modify the stored data with the new values
//       const updatedData = { ...medicalFormData, fileUrl: `${minioEndpoint}/${bucketName}/${fileName}` };
//       await store.put(updatedData);  // No need to provide 'id' as a parameter

//       console.log('Data updated in IndexedDB:', updatedData);
//       setMedicalFormData(updatedData);
//     }
//   } catch (error) {
//     console.error('Error:', error);
//   }
// };
//   return (
//     <Container component="main" maxWidth="md">
//     <Typography variant="h3" align="center" gutterBottom>
//       Medical Form
//     </Typography>

//     <form onSubmit={handleSubmit}>
//       <Grid container spacing={2}>
//         <Grid item xs={12} sm={6}>
//           <TextField
//             fullWidth
//             variant="outlined"
//             margin="normal"
//             required
//             id="firstName"
//             label="First Name"
//             name="firstName"
//             value={medicalFormData.firstName || ''}
//             onChange={handleChange}
//           />
//         </Grid>

//         <Grid item xs={12} sm={6}>
//           <TextField
//             fullWidth
//             variant="outlined"
//             margin="normal"
//             required
//             id="lastName"
//             label="Last Name"
//             name="lastName"
//             value={medicalFormData.lastName || ''}
//             onChange={handleChange}
//           />
//         </Grid>

//         <Grid item xs={12} sm={6}>
//           <TextField
//             fullWidth
//             variant="outlined"
//             margin="normal"
//             required
//             id="phoneNumber"
//             label="Phone Number"
//             name="phoneNumber"
//             type="tel"
//             value={medicalFormData.phoneNumber || ''}
//             onChange={handleChange}
//           />
//         </Grid>
//         <Grid item xs={12} sm={6}>
//           <TextField
//             fullWidth
//             variant="outlined"
//             margin="normal"
//             required
//             id="email"
//             label="Email Address"
//             name="email"
//             type="email"  
//             value={medicalFormData.email || ''}
//             onChange={handleChange}
//           />
//         </Grid>

//         <Grid item xs={12} sm={6}>
//             <TextField
//               fullWidth
//               variant="outlined"
//               margin="normal"
//               required
//               id="dob"
//               label="Date of Birth"
//               name="dob"
//               type="date"
//               InputLabelProps={{
//                 shrink: true,
//               }}
//               value={medicalFormData.dob || ''}
//               onChange={handleChange}
//             />
//           </Grid>

//         <Grid item xs={12} sm={6}>
//           <FormControl fullWidth margin="normal">
//             <InputLabel htmlFor="gender">Gender</InputLabel>
//             <Select
//               label="Gender"
//               name="gender"
//               value={medicalFormData.gender || ''}
//               onChange={handleChange}
//             >
//               <MenuItem value="male">Male</MenuItem>
//               <MenuItem value="female">Female</MenuItem>
//             </Select>
//           </FormControl>
//         </Grid>

//         <Grid item xs={12}>
//             <FormControl fullWidth margin="normal">
//               <InputLabel htmlFor="disease">Disease</InputLabel>
//               <Select
//                 label="Disease"
//                 name="disease"
//                 multiple
//                 value={medicalFormData.disease || []}
//                 onChange={handleChange}
//               >
//                 {diseases.map((disease) => (
//                   <MenuItem key={disease} value={disease}>
//                     {disease}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           </Grid>
//         <Grid item xs={12} sm={6}>
//           <TextField
//             fullWidth
//             variant="outlined"
//             margin="normal"
//             required
//             id="height"
//             label="Height (cm)"
//             name="height"
//             type="number"
//             value={medicalFormData.height || ''}
//             onChange={handleChange}
//           />
//         </Grid>

//         <Grid item xs={12} sm={6}>
//           <TextField
//             fullWidth
//             variant="outlined"
//             margin="normal"
//             required
//             id="weight"
//             label="Weight (kg)"
//             name="weight"
//             type="number"
//             value={medicalFormData.weight || ''}
//             onChange={handleChange}
//           />
//         </Grid>

//         <Grid item xs={12} sm={6}>
//           <TextField
//             fullWidth
//             variant="outlined"
//             margin="normal"
//             required
//             id="bmi"
//             label="BMI"
//             name="bmi"
//             type="number"
//             size="small"
//             value={medicalFormData.bmi || ''}
//             onChange={handleChange}
//             InputProps={{
//               readOnly: true,
//             }}
//           />
//         </Grid>

//         <Grid item xs={12}>
//           <input type="file" name="file" onChange={handleFileChange} style={{ width: '100%', marginTop: '10px' }}/>
//         </Grid>

//         <Grid item xs={12}>
//           <Button
//             type="submit"
//             variant="contained"
//             color="primary"
//             fullWidth
//             style={{ marginTop: '20px' }}
//           >
//             Save
//           </Button>
//         </Grid>
//       </Grid>
      
//     </form>
//   </Container>
//   );
// };

// export default Edit;