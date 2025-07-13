import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInAnonymously, signInWithCustomToken } from 'firebase/auth'; // Added signInWithCustomToken
import { getFirestore, collection, query, onSnapshot, doc, setDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { ShoppingCart, X, Plus, Minus, Loader2, User, LogOut, Settings, Edit, Trash2, Save, XCircle } from 'lucide-react';

// Firebase configuration from environment variables for Netlify deployment
// For Canvas environment, we use the global variables provided.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// The appId for Firestore paths will be the projectId
const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


// Initialize Firebase App
let app;
let db;
let auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (error) {
    console.error("Error initializing Firebase:", error);
    // Handle error gracefully, e.g., display a message to the user
}

// Sample products (for initial setup if Firestore is empty)
const sampleProducts = [
    { id: '1', name: 'Cute Floral Dress', description: 'Light and airy floral dress for girls.', price: 25.99, imageUrl: 'https://placehold.co/300x300/e0f2f7/000000?text=Floral+Dress', category: 'Girl Clothes' },
    { id: '2', name: 'Sparkle Gold Earring', description: 'Small 18k gold earrings, perfect for daily wear.', price: 120.00, imageUrl: 'https://placehold.co/300x300/fef3c7/000000?text=Gold+Earring', category: 'Small Gold' },
    { id: '3', name: 'Crispy Seaweed Snack', description: 'Delicious and healthy roasted seaweed snack.', price: 3.50, imageUrl: 'https://placehold.co/300x300/d1fae5/000000?text=Seaweed+Snack', category: 'Snacks' },
    { id: '4', name: 'Princess Gown', description: 'Elegant gown for special occasions.', price: 45.00, imageUrl: 'https://placehold.co/300x300/fce7f3/000000?text=Princess+Gown', category: 'Girl Clothes' },
    { id: '5', name: 'Mini Gold Bar (1g)', description: '1 gram pure gold bar, investment grade.', price: 75.00, imageUrl: 'https://placehold.co/300x300/fef3c7/000000?text=Mini+Gold+Bar', category: 'Small Gold' },
    { id: '6', name: 'Spicy Potato Chips', description: 'Crunchy potato chips with a kick.', price: 2.75, imageUrl: 'https://placehold.co/300x300/ffe4e6/000000?text=Spicy+Chips', category: 'Snacks' },
];

// Function to initialize sample products in Firestore if the collection is empty
const initializeProducts = async (dbInstance) => { // Removed userId parameter as appId is global
    if (!dbInstance) return;

    const productsRef = collection(dbInstance, `artifacts/${appId}/public/data/products`);
    const q = query(productsRef);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("Initializing sample products into Firestore...");
        for (const product of sampleProducts) {
            await setDoc(doc(productsRef, product.id), product);
        }
        console.log("Sample products initialized.");
    } else {
        console.log("Products already exist in Firestore.");
    }
};

const ProductManagement = ({ products, setProducts, userRole, setLoading, setError }) => {
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', imageUrl: '', category: 'Girl Clothes' });
    const categories = ['Girl Clothes', 'Small Gold', 'Snacks'];

    const handleEditClick = (product) => {
        setEditingProduct({ ...product });
    };

    const handleNewProductChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProduct = async (productToSave) => {
        setLoading(true);
        try {
            const productRef = doc(db, `artifacts/${appId}/public/data/products`, productToSave.id);
            await setDoc(productRef, productToSave, { merge: false }); // Overwrite for full update
            setEditingProduct(null);
            console.log("Product saved:", productToSave.id);
        } catch (e) {
            console.error("Error saving product:", e);
            setError("Failed to save product. Check permissions.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) {
            return;
        }
        setLoading(true);
        try {
            const productRef = doc(db, `artifacts/${appId}/public/data/products`, productId);
            await deleteDoc(productRef);
            console.log("Product deleted:", productId);
        } catch (e) {
            console.error("Error deleting product:", e);
            setError("Failed to delete product. Check permissions.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price || !newProduct.category) {
            alert("Please fill in all required fields for the new product.");
            return;
        }
        setLoading(true);
        try {
            const newId = Date.now().toString(); // Simple unique ID
            const productToAdd = {
                ...newProduct,
                id: newId,
                price: parseFloat(newProduct.price) || 0,
                imageUrl: newProduct.imageUrl || `https://placehold.co/300x300/cccccc/333333?text=New+Product`
            };
            const productRef = doc(db, `artifacts/${appId}/public/data/products`, newId);
            await setDoc(productRef, productToAdd);
            setNewProduct({ name: '', description: '', price: '', imageUrl: '', category: 'Girl Clothes' });
            console.log("New product added:", newId);
        } catch (e) {
            console.error("Error adding product:", e);
            setError("Failed to add product. Check permissions.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-8">
            <h2 className="text-2xl font-bold text-purple-700 mb-6">Product Management</h2>

            {/* Add New Product Form */}
            <div className="mb-8 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="text-xl font-semibold text-purple-600 mb-4">Add New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        name="name"
                        placeholder="Product Name"
                        value={newProduct.name}
                        onChange={handleNewProductChange}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                    <input
                        type="number"
                        name="price"
                        placeholder="Price"
                        value={newProduct.price}
                        onChange={handleNewProductChange}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                    <input
                        type="text"
                        name="imageUrl"
                        placeholder="Image URL (optional)"
                        value={newProduct.imageUrl}
                        onChange={handleNewProductChange}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                    <select
                        name="category"
                        value={newProduct.category}
                        onChange={handleNewProductChange}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <textarea
                        name="description"
                        placeholder="Description (optional)"
                        value={newProduct.description}
                        onChange={handleNewProductChange}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 col-span-full"
                        rows="2"
                    ></textarea>
                </div>
                <button
                    onClick={handleAddProduct}
                    className="mt-4 px-6 py-2 bg-green-500 text-white font-semibold rounded-full shadow-md hover:bg-green-600 transition-colors"
                >
                    Add Product
                </button>
            </div>

            {/* Product List for Editing */}
            <div className="grid grid-cols-1 gap-4">
                {products.map(product => (
                    <div key={product.id} className="bg-gray-50 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between">
                        {editingProduct && editingProduct.id === product.id ? (
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                                <input
                                    type="text"
                                    name="name"
                                    value={editingProduct.name}
                                    onChange={handleEditChange}
                                    className="p-2 border border-gray-300 rounded-lg"
                                />
                                <input
                                    type="number"
                                    name="price"
                                    value={editingProduct.price}
                                    onChange={handleEditChange}
                                    className="p-2 border border-gray-300 rounded-lg"
                                />
                                <select
                                    name="category"
                                    value={editingProduct.category}
                                    onChange={handleEditChange}
                                    className="p-2 border border-gray-300 rounded-lg"
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select> {/* Removed extra '>' here */}
                                <input
                                    type="text"
                                    name="imageUrl"
                                    placeholder="Image URL"
                                    value={editingProduct.imageUrl}
                                    onChange={handleEditChange}
                                    className="p-2 border border-gray-300 rounded-lg col-span-full"
                                />
                                <textarea
                                    name="description"
                                    placeholder="Description"
                                    value={editingProduct.description}
                                    onChange={handleEditChange}
                                    className="p-2 border border-gray-300 rounded-lg col-span-full"
                                    rows="2"
                                ></textarea>
                                <div className="flex space-x-2 mt-2 md:col-span-full justify-end">
                                    <button
                                        onClick={() => handleSaveProduct(editingProduct)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center"
                                    >
                                        <Save className="h-4 w-4 mr-1" /> Save
                                    </button>
                                    <button
                                        onClick={() => setEditingProduct(null)}
                                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors flex items-center"
                                    >
                                        <XCircle className="h-4 w-4 mr-1" /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-lg text-gray-800">{product.name}</h4>
                                    <p className="text-sm text-gray-600">${product.price.toFixed(2)} - {product.category}</p>
                                </div>
                                <div className="flex space-x-2 mt-3 md:mt-0">
                                    <button
                                        onClick={() => handleEditClick(product)}
                                        className="p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                                        aria-label="Edit product"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                        aria-label="Delete product"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const UserManagement = ({ userRole, setLoading, setError }) => {
    const [users, setUsers] = useState([]);
    const roles = ['user', 'admin', 'super_admin'];

    useEffect(() => {
        if (!db || userRole !== 'super_admin') return;

        // Fetch user profiles (roles)
        const userProfilesRef = collection(db, `artifacts/${appId}/users`);
        const unsubscribe = onSnapshot(userProfilesRef, async (snapshot) => {
            const fetchedUsers = [];
            for (const docSnap of snapshot.docs) {
                const userId = docSnap.id;
                const profileDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
                const profileSnap = await getDoc(profileDocRef);
                fetchedUsers.push({
                    uid: userId,
                    email: docSnap.data().email || 'N/A', // Assuming email might be stored here or fetched from auth
                    role: profileSnap.exists() ? profileSnap.data().role : 'user' // Default to 'user' if no role
                });
            }
            setUsers(fetchedUsers);
        }, (err) => {
            console.error("Error fetching users:", err);
            setError("Failed to load users. Check permissions.");
        });

        return () => unsubscribe();
    }, [db, userRole]);

    const handleUpdateRole = async (uid, newRole) => {
        setLoading(true);
        try {
            const userProfileRef = doc(db, `artifacts/${appId}/users/${uid}/profile/data`);
            await setDoc(userProfileRef, { role: newRole }, { merge: true });
            console.log(`Updated role for ${uid} to ${newRole}`);
        } catch (e) {
            console.error("Error updating user role:", e);
            setError("Failed to update user role. Check permissions.");
        } finally {
            setLoading(false);
        }
    };

    if (userRole !== 'super_admin') {
        return (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                You do not have permission to manage users.
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-purple-700 mb-6">User Management</h2>
            <div className="grid grid-cols-1 gap-4">
                {users.map(user => (
                    <div key={user.uid} className="bg-gray-50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-800">User ID: {user.uid.substring(0, 10)}...</p>
                            <p className="text-sm text-gray-600">Email: {user.email}</p>
                        </div>
                        <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.uid, e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        >
                            {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
};


const App = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null); // Firebase Auth user object
    const [userRole, setUserRole] = useState('user'); // Default role
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [currentView, setCurrentView] = useState('shop'); // 'shop' or 'admin'

    const categories = ['All', 'Girl Clothes', 'Small Gold', 'Snacks'];
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Firebase Initialization and Auth Listener
    useEffect(() => {
        if (!app || !db || !auth) {
            setError("Firebase is not initialized. Please check your configuration.");
            setLoading(false);
            return;
        }

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // Fetch user role from Firestore
                const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
                const unsubscribeProfile = onSnapshot(userProfileRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserRole(docSnap.data().role || 'user');
                    } else {
                        // If no profile, set default role and create profile document
                        setUserRole('user');
                        setDoc(userProfileRef, { role: 'user', email: user.email || 'N/A' }, { merge: true }).catch(e => console.error("Error setting initial user profile:", e));
                    }
                }, (err) => {
                    console.error("Error fetching user role:", err);
                    setError("Failed to load user role.");
                });
                // Initialize sample products only after auth is ready and user is known
                await initializeProducts(db);
                // Return unsubscribe function for profile listener
                return () => unsubscribeProfile();
            } else {
                setUserRole('user'); // Reset role if no user
                // Sign in anonymously if no user
                try {
                    // Only try to sign in with custom token if it's provided
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (err) {
                    console.error("Error signing in anonymously:", err);
                    setError("Failed to authenticate anonymously.");
                }
            }
            setIsAuthReady(true);
            setLoading(false); // Set loading to false once auth state is determined
        });

        // Cleanup function for auth listener
        return () => unsubscribeAuth();
    }, []);

    // Fetch products from Firestore
    useEffect(() => {
        if (!db || !isAuthReady || !currentUser) { // Added currentUser to dependency
            return;
        }

        const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
        const q = query(productsCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedProducts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(fetchedProducts);
        }, (err) => {
            console.error("Error fetching products:", err);
            setError("Failed to load products. Please try again later.");
        });

        return () => unsubscribe();
    }, [db, isAuthReady, currentUser]); // Added currentUser to dependency

    // Fetch and sync cart data from Firestore
    useEffect(() => {
        if (!db || !isAuthReady || !currentUser) {
            // If currentUser is null (e.g., during anonymous sign-in), do not fetch cart yet.
            // Cart is tied to a specific user ID.
            return;
        }

        const userCartDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/cart/myCart`);

        const unsubscribeCart = onSnapshot(userCartDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const cartData = docSnap.data().items || [];
                setCart(cartData);
            } else {
                setCart([]); // Cart document doesn't exist, initialize empty cart
            }
        }, (err) => {
            console.error("Error fetching cart:", err);
            setError("Failed to load cart. Please try again.");
        });

        return () => unsubscribeCart();
    }, [db, isAuthReady, currentUser]); // Depend on currentUser to ensure cart is fetched for the correct user

    // Function to update cart in Firestore
    const updateCartInFirestore = async (newCart) => {
        if (!db || !currentUser) {
            console.warn("Firestore or user not available for cart update.");
            return;
        }
        const userCartDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/cart/myCart`);
        try {
            await setDoc(userCartDocRef, { items: newCart }, { merge: true });
        } catch (e) {
            console.error("Error updating cart in Firestore:", e);
            setError("Failed to update cart. Please try again.");
        }
    };

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            let newCart;
            if (existingItem) {
                newCart = prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                newCart = [...prevCart, { ...product, quantity: 1 }];
            }
            updateCartInFirestore(newCart);
            return newCart;
        });
    };

    const updateQuantity = (productId, delta) => {
        setCart(prevCart => {
            let newCart = prevCart.map(item =>
                item.id === productId ? { ...item, quantity: item.quantity + delta } : item
            ).filter(item => item.quantity > 0);
            updateCartInFirestore(newCart);
            return newCart;
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => {
            const newCart = prevCart.filter(item => item.id !== productId);
            updateCartInFirestore(newCart);
            return newCart;
        });
    };

    const getTotalItemsInCart = () => {
        return cart.reduce((total, item) => total + (item.quantity || 0), 0);
    };

    const getCartTotalPrice = () => {
        return cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0).toFixed(2);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setShowLoginModal(false);
        } catch (err) {
            console.error("Login error:", err);
            setLoginError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // After signup, immediately create a user profile in Firestore with default 'user' role
            const userProfileRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/data`);
            await setDoc(userProfileRef, { role: 'user', email: userCredential.user.email }, { merge: true });
            setShowLoginModal(false);
        } catch (err) {
            console.error("Sign up error:", err);
            setLoginError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setCurrentUser(null);
            setUserRole('user');
            setCart([]); // Clear cart on sign out
            setCurrentView('shop'); // Go back to shop view
        } catch (err) {
            console.error("Sign out error:", err);
            setError("Failed to sign out.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
                <p className="ml-3 text-lg text-gray-700">Initializing Firebase...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 p-4 rounded-lg">
                <p>Error: {error}</p>
            </div>
        );
    }

    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(product => product.category === selectedCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 font-inter text-gray-800">
            {/* Header */}
            <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center rounded-b-xl">
                <h1 className="text-3xl font-bold text-purple-600 cursor-pointer" onClick={() => setCurrentView('shop')}>My Little Shop</h1>
                <div className="flex items-center space-x-4">
                    {currentUser && currentUser.uid && (
                        <span className="text-sm text-gray-600 hidden md:block">
                            {currentUser.email ? currentUser.email : `User ID: ${currentUser.uid.substring(0, 8)}...`} ({userRole})
                        </span>
                    )}

                    {(userRole === 'admin' || userRole === 'super_admin') && (
                        <button
                            onClick={() => setCurrentView('admin')}
                            className={`p-2 rounded-full ${currentView === 'admin' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'} hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-200`}
                            aria-label="Admin Panel"
                        >
                            <Settings className="h-6 w-6" />
                        </button>
                    )}

                    <button
                        onClick={() => setShowCart(!showCart)}
                        className="relative p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-200"
                        aria-label="View Cart"
                    >
                        <ShoppingCart className="h-6 w-6" />
                        {getTotalItemsInCart() > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {getTotalItemsInCart()}
                            </span>
                        )}
                    </button>

                    {currentUser ? (
                        <button
                            onClick={handleSignOut}
                            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200"
                            aria-label="Sign Out"
                        >
                            <LogOut className="h-6 w-6" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-200"
                            aria-label="Sign In"
                        >
                            <User className="h-6 w-6" />
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-6">
                {currentView === 'shop' && (
                    <>
                        {/* Category Filter */}
                        <div className="mb-8 flex flex-wrap justify-center gap-3">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-5 py-2 rounded-full text-lg font-medium transition-all duration-300
                                        ${selectedCategory === category
                                            ? 'bg-purple-600 text-white shadow-lg'
                                            : 'bg-white text-gray-700 hover:bg-purple-100 hover:text-purple-700 border border-gray-200'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <div key={product.id} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 group">
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-48 object-cover object-center rounded-t-xl"
                                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/300x300/cccccc/333333?text=Image+Not+Found`; }}
                                        />
                                        <div className="p-5">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                                            <div className="flex justify-between items-center mt-4">
                                                <span className="text-2xl font-bold text-purple-700">${(product.price || 0).toFixed(2)}</span>
                                                <button
                                                    onClick={() => addToCart(product)}
                                                    className="px-6 py-2 bg-purple-500 text-white font-semibold rounded-full shadow-md hover:bg-purple-600 transition-colors duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                                                >
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center text-gray-600 text-lg py-10">
                                    No products found in this category.
                                </div>
                            )}
                        </div>
                    </>
                )}

                {currentView === 'admin' && (userRole === 'admin' || userRole === 'super_admin') && (
                    <>
                        <ProductManagement
                            products={products}
                            setProducts={setProducts}
                            userRole={userRole}
                            setLoading={setLoading}
                            setError={setError}
                        />
                        {userRole === 'super_admin' && (
                            <UserManagement
                                userRole={userRole}
                                setLoading={setLoading}
                                setError={setError}
                            />
                        )}
                    </>
                )}

                {currentView === 'admin' && !(userRole === 'admin' || userRole === 'super_admin') && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
                        You do not have administrative access. Please sign in with an admin account.
                    </div>
                )}
            </main>

            {/* Cart Sidebar */}
            {showCart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
                    <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col rounded-l-2xl animate-slide-in-right">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-2xl font-bold text-purple-700">Your Cart</h2>
                            <button
                                onClick={() => setShowCart(false)}
                                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
                                aria-label="Close Cart"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <p className="text-gray-500 text-center mt-10">Your cart is empty.</p>
                        ) : (
                            <>
                                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl mb-3 shadow-sm">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded-lg mr-4"
                                                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/64x64/cccccc/333333?text=No+Img`; }}
                                            />
                                            <div className="flex-grow">
                                                <h4 className="font-semibold text-gray-800">{item.name}</h4>
                                                <p className="text-sm text-gray-600">${(item.price || 0).toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="p-1 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="font-medium text-lg">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="p-1 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="ml-3 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    aria-label="Remove item"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xl font-semibold text-gray-800">Total:</span>
                                        <span className="text-2xl font-bold text-purple-700">${getCartTotalPrice()}</span>
                                    </div>
                                    <button
                                        className="w-full py-3 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                                    >
                                        Proceed to Checkout (Demo)
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Login/Signup Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform scale-95 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-purple-700">Login / Sign Up</h2>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline transition-colors"
                                >
                                    Login
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSignUp}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tailwind CSS CDN and custom styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

                .font-inter {
                    font-family: 'Inter', sans-serif;
                }

                .animate-slide-in-right {
                    animation: slideInRight 0.3s ease-out forwards;
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default App;
