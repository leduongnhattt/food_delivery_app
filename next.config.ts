import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['images.unsplash.com', 'raw.githubusercontent.com', 'res.cloudinary.com'],
  },
  env: {
    BASE_IMAGE_URL: 'https://raw.githubusercontent.com/leduongnhattt/food-delivery-static/master/images',
  },
};

export default nextConfig;
