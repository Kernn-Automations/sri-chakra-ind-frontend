import React, { useRef, useState, useEffect } from "react";
import img from "../../../images/dummy-img.jpeg";
import styles from "./HomePage.module.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { FaStar, FaEye, FaShoppingCart } from "react-icons/fa";

function Productbox({ products }) {
  const scrollRef = useRef(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());
  const [imageCache, setImageCache] = useState(new Map());

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  // Use actual products data from backend, limit to 4 products
  const displayProducts = (products || []).slice(0, 4);

  // Helper function to get product image URL
  const getProductImage = (product) => {
    // Try different possible image field names from backend
    const imageField = product.image || 
                      product.imageUrl || 
                      product.imageUrls?.[0] || 
                      product.productImage || 
                      product.productImages?.[0] ||
                      product.images?.[0] ||
                      product.product?.image ||
                      product.product?.imageUrl ||
                      product.product?.imageUrls?.[0] ||
                      product.product?.productImage ||
                      product.product?.productImages?.[0] ||
                      product.product?.images?.[0];
    
    if (imageField) {
      // If it's already a full URL, use it directly
      if (imageField.startsWith('http://') || imageField.startsWith('https://')) {
        return imageField;
      }
      
      // If it's a relative path, construct the full URL
      const apiUrl = import.meta.env.VITE_API_URL;
      const cleanPath = imageField.startsWith('/') ? imageField.slice(1) : imageField;
      return `${apiUrl}/${cleanPath}`;
    }
    
    // Return default image if no image found
    return img;
  };

  // Fetch image through backend API to bypass CORS
  const fetchImageAsBlob = async (imageUrl) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      return null;
    } catch (error) {
      console.log('Failed to fetch image as blob:', error);
      return null;
    }
  };

  // Handle image load error with CORS workaround
  const handleImageError = async (product, e) => {
    console.log('Productbox - Image load error for product:', product.name, 'Image URL:', e.target.src);
    
    // If this is already a blob URL that failed, don't try to fetch again
    if (e.target.src.startsWith('blob:')) {
      console.log('Productbox - Blob URL failed, using default image for:', product.name);
      setFailedImages(prev => new Set([...prev, product.name]));
      e.target.src = img;
      return;
    }
    
    // Try to fetch image through backend API with authentication
    const blobUrl = await fetchImageAsBlob(e.target.src);
    
    if (blobUrl) {
      // Cache the blob URL
      setImageCache(prev => new Map(prev).set(product.name, blobUrl));
      e.target.src = blobUrl;
      console.log('Productbox - Image loaded successfully via blob for:', product.name);
    } else {
      // Mark this image as failed
      setFailedImages(prev => new Set([...prev, product.name]));
      // Use default image
      e.target.src = img;
    }
  };

  // Get image source with fallback for failed images
  const getImageSource = (product) => {
    // If image has already failed, use default
    if (failedImages.has(product.name)) {
      return img;
    }
    
    // Check if we have a cached blob URL
    const cachedUrl = imageCache.get(product.name);
    if (cachedUrl) {
      return cachedUrl;
    }
    
    return getProductImage(product);
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      imageCache.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return (
    <>
      {displayProducts && displayProducts.length !== 0 && (
        <div className={styles.enhancedProductCard}>
          <div className={styles.productHeader}>
            <h4>Top Selling Products</h4>
            <div className={styles.productStats}>
              <span className={styles.totalSales}>
                Total Sales: ₹{displayProducts.reduce((sum, p) => sum + (p.sales || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className={styles.scrollContainer}>
            {displayProducts.length > 4 && (
              <button className={styles.scrollArrow} onClick={() => scroll("left")}>
                <FaChevronLeft/>
              </button>
            )}
            
            <div className={styles.productGrid} ref={scrollRef}>
              {displayProducts.map((product, index) => (
                <div 
                  key={index} 
                  className={styles.productItem}
                  onMouseEnter={() => setHoveredProduct(index)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div className={styles.productImage}>
                    <img 
                      src={getImageSource(product)} 
                      alt={product.name}
                      onError={(e) => handleImageError(product, e)}
                    />
                    <div className={styles.productOverlay}>
                      <div className={styles.productActions}>
                        <button className={styles.actionBtn}>
                          <FaEye />
                        </button>
                        <button className={styles.actionBtn}>
                          <FaShoppingCart />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.productInfo}>
                    <h6 className={styles.productName}>{product.name}</h6>
                    
                    <div className={styles.productMetrics}>
                      <div className={styles.salesInfo}>
                        <span className={styles.salesLabel}>Sales</span>
                        <span className={styles.salesValue}>₹{(product.sales || 0).toLocaleString()}</span>
                      </div>
                      
                      <div className={styles.ratingInfo}>
                        <FaStar className={styles.starIcon} />
                        <span className={styles.ratingValue}>4.5</span>
                      </div>
                    </div>
                    
                    <div className={styles.productViews}>
                      <span className={styles.viewsCount}>Top Seller</span>
                    </div>
                  </div>
                  
                  {hoveredProduct === index && (
                    <div className={styles.productTooltip}>
                      <div className={styles.tooltipContent}>
                        <h6>{product.name}</h6>
                        <p>Monthly sales: ₹{(product.sales || 0).toLocaleString()}</p>
                        <p>Status: Top Selling Product</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {displayProducts.length > 4 && (
              <button className={styles.scrollArrow} onClick={() => scroll("right")}>
                <FaChevronRight/>
              </button>
            )}
          </div>
          
          <div className={styles.productFooter}>
            <div className={styles.categoryTags}>
              <span className={styles.categoryTag}>Top Sellers</span>
              <span className={styles.categoryTag}>Best Performing</span>
            </div>
            <div className={styles.viewAllBtn}>
              View All Products →
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Productbox;
