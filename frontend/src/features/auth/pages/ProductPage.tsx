// // Halaman untuk melihat daftar produk.

// // Import useEffect dan useState dari React.
// import { useEffect, useState } from "react";

// // Import fungsi untuk mengambil produk.
// import { getProducts } from "../../../api/productApi";

// // Import tipe Product.
// import type { Product } from "../../../types/product";

// // Komponen halaman produk.
// export default function ProductsPage() {
//   // Menyimpan daftar produk.
//   const [products, setProducts] = useState<Product[]>([]);

//   // Menjalankan kode saat halaman pertama kali dibuka.
//   useEffect(() => {
//     // Fungsi untuk mengambil produk.
//     const fetchProducts = async () => {
//       // Memanggil API produk.
//       const data = await getProducts();

//       // Menyimpan hasil ke state.
//       setProducts(data);
//     };

//     // Menjalankan fungsi pengambilan produk.
//     fetchProducts();
//   }, []);

//   // Menampilkan daftar produk.
//   return (
//     <div>
//       <h1>Daftar Produk</h1>

//       <ul>
//         {products.map((product) => (
//           <li key={product.id}>
//             {product.name} - Rp{product.price} - Stok: {product.stock}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
