const cloudinaryConfig = {
    cloudName: "kzrmwfn8",
    uploadPreset: "joy portfolio"
};

// Function to upload image from Admin panel (will be called from admin script)
async function uploadToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryConfig.uploadPreset);

    const response = await fetch(url, { method: "POST", body: formData });
    const data = await response.json();
    return data.secure_url; // Returns the uploaded image URL
}
