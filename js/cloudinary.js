// Cloudinary configuration
const cloudinaryConfig = {
    cloudName: "kzrmwfn8",
    uploadPreset: "joy portfolio"
};

// Function to upload image to Cloudinary (Can be triggered from your admin panel later)
async function uploadToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryConfig.uploadPreset);

    try {
        const response = await fetch(url, { method: "POST", body: formData });
        const data = await response.json();
        return data.secure_url; // Returns the uploaded image URL
    } catch (error) {
        console.error("Error uploading image: ", error);
        return null;
    }
}
