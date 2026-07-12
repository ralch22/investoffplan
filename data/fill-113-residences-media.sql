-- 113 Residences media + video recovery
UPDATE projects
SET
  image_url = '/cdn/projects/113-residences/gallery/000.webp',
  image_gallery = '["/cdn/projects/113-residences/gallery/000.webp", "/cdn/projects/113-residences/gallery/001.webp"]',
  video_url = 'https://www.youtube.com/shorts/jVlmFyzAfPw',
  video_available = 1
WHERE slug = '113-residences';
