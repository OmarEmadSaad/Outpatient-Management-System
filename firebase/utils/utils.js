import { ref, update } from "firebase/database";
import { db } from "../config";
export function updateProductQuantity(productId, newQuantity) {
  const productRef = ref(db, `products/${productId}`);
  return update(productRef, {
    quantity: newQuantity,
  })
    .then(() => {
      console.log("Quantity updated in Firebase!");
    })
    .catch((error) => {
      console.error("Error updating quantity:", error);
    });
}
