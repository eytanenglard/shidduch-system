// בקובץ החדש cloudinary-loader.js

export default function cloudinaryLoader({ src, width, quality }) {
  // שם החשבון שלך ב-Cloudinary
  const cloudName = 'dmfxoi6g0';
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];
  
  // מסירים את הלוכסן המוביל אם הוא קיים ב-src
  const cleanedSrc = src.startsWith('/') ? src.substring(1) : src;

  return `https://res.cloudinary.com/${cloudName}/image/upload/${params.join(',')}/${cleanedSrc}`;
}

