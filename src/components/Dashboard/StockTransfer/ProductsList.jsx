import React, { useState } from "react";
import styles from "./Stock.module.css";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";

function ProductsList({ items }) {
  const [imageIndexes, setImageIndexes] = useState({});

  const getSafeKey = (item, index) => `item-${index}`;

  const handleNextImage = (key, length) => {
    setImageIndexes((prev) => {
      const current = typeof prev[key] === "number" ? prev[key] : 0;
      return {
        ...prev,
        [key]: (current + 1) % length,
      };
    });
  };

  const handlePrevImage = (key, length) => {
    setImageIndexes((prev) => {
      const current = typeof prev[key] === "number" ? prev[key] : 0;
      return {
        ...prev,
        [key]: (current - 1 + length) % length,
      };
    });
  };

  return (
    <>
      {items?.map((item, index) => {
        const key = getSafeKey(item, index);
        const images = item.product?.images || [];
        const currentImageIndex =
          typeof imageIndexes[key] === "number" ? imageIndexes[key] : 0;

        return (
          <div key={key} className={styles.itemContainer}>
            <h6>{item.product?.name}</h6>
            <p>
              Quantity: {item.quantity}{" "}
              {item.productType === "packed" ? `packs (${item.product?.packageWeight || ""}${item.product?.unit} each)` : `${item.product?.unit}(s)`} 
              
            </p>
            <p>Total: {item.quantity * item.product?.purchasePrice}</p>

            {/* {item.taxes?.map((tax, i) => (
              <p key={i} className={styles.tax}>
                {tax.name}: {tax.amount} ({tax.percentage}%)
              </p>
            ))} */}

            {images.length > 0 && (
              <div className={styles.carousel}>
                <button
                  onClick={() => handlePrevImage(key, images.length)}
                  className={styles.arrow}
                >
                  <IoIosArrowBack/>
                </button>
                <div className={styles.imageSlider}>
                  <div
                    className={styles.sliderInner}
                    style={{
                      width: `${images.length * 100}%`,
                      transform: `translateX(-${currentImageIndex * (100 / images.length)}%)`,
                    }}
                  >
                    {images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`product-${i}`}
                        className={styles.slideImage}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleNextImage(key, images.length)}
                  className={styles.arrow}
                >
                  <IoIosArrowForward/>
                </button>
              </div>
            )}

            {/* <p><strong>Total Amount :</strong>{item.totalPrice}</p> */}
          </div>
        );
      })}
    </>
  );
}

export default ProductsList;
