"use client";

import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

// 1. Define the TypeScript type for the strict Vercel compiler
type ScannedItem = {
  id: number;
  name: string;
  price: number;
  confidence: string;
  assignedTo: string[];
};

// Mock AI Data simulating a scanned receipt
const MOCK_SCANNED_ITEMS: ScannedItem[] = [
  { id: 1, name: "Paneer Tikka Masala", price: 350, confidence: "high", assignedTo: [] },
  { id: 2, name: "Garl!c Na@n", price: 120, confidence: "low", assignedTo: [] },
  { id: 3, name: "Cold Coffee", price: 180, confidence: "high", assignedTo: [] },
  { id: 4, name: "M!neral W*ter", price: 40, confidence: "low", assignedTo: [] },
];

export default function Home() {
  const [step, setStep] = useState<"upload" | "scanning" | "review" | "split" | "upi">("upload");
  
  // 2. Tell useState to explicitly use the ScannedItem array type
  const [items, setItems] = useState<ScannedItem[]>(MOCK_SCANNED_ITEMS);
  const [friends, setFriends] = useState(["Me", "Rahul", "Priya"]);
  const [newFriend, setNewFriend] = useState("");
  
  // New States for Image Upload and UPI Links
  const [upiId, setUpiId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setStep("scanning"); // Move to scanning automatically once image is selected
    }
  };

  // Simulate AI scanning delay
  useEffect(() => {
    if (step === "scanning") {
      const timer = setTimeout(() => setStep("review"), 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleItemEdit = (id: number, field: "name" | "price", value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === "price" ? Number(value) || 0 : value,
            confidence: "high",
          };
        }
        return item;
      })
    );
  };

  const toggleAssign = (itemId: number, friend: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const isAssigned = item.assignedTo.includes(friend);
          return {
            ...item,
            assignedTo: isAssigned
              ? item.assignedTo.filter((f) => f !== friend)
              : [...item.assignedTo, friend],
          };
        }
        return item;
      })
    );
  };

  const addFriend = () => {
    if (newFriend.trim() && !friends.includes(newFriend.trim())) {
      setFriends([...friends, newFriend.trim()]);
      setNewFriend("");
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const gst = subtotal * 0.05; // 5% GST
  const total = subtotal + gst;

  const getSplitData = () => {
    const splitRecord: Record<string, number> = {};
    friends.forEach((f) => (splitRecord[f] = 0));

    items.forEach((item) => {
      const assignees = item.assignedTo.length > 0 ? item.assignedTo : friends;
      const costPerPerson = item.price / assignees.length;
      assignees.forEach((f) => {
        splitRecord[f] += costPerPerson;
      });
    });

    friends.forEach((f) => {
      if (splitRecord[f] > 0) {
        const proportion = splitRecord[f] / subtotal;
        splitRecord[f] += gst * proportion;
      }
    });

    return splitRecord;
  };

  // Generate UPI Deep Link
  const generateUpiLink = (amount: number) => {
    const formattedAmount = amount.toFixed(2);
    const encodedName = encodeURIComponent(receiverName || "SplitPay User");
    // Standard UPI intent URI format
    return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${formattedAmount}&cu=INR`;
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-orange-500 p-6 text-white text-center rounded-b-3xl shadow-md">
          <h1 className="text-2xl font-bold tracking-wide">SplitPay AI</h1>
          <p className="text-orange-100 text-sm mt-1">Smart Bill Splitter</p>
        </div>

        <div className="p-6">
          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div className="text-center space-y-6 py-8">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">📸</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Upload Restaurant Bill</h2>
                <p className="text-gray-500 text-sm">Select an image from your device gallery or camera.</p>
              </div>
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden" 
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Choose Image
              </button>
            </div>
          )}

          {/* STEP 2: SCANNING */}
          {step === "scanning" && (
            <div className="text-center space-y-6 py-8">
              {imagePreview && (
                <div className="w-32 h-40 mx-auto rounded-xl overflow-hidden border-2 border-orange-200 shadow-sm relative">
                  <img src={imagePreview} alt="Receipt" className="object-cover w-full h-full opacity-50" />
                  <div className="absolute inset-0 bg-orange-500/20 animate-pulse"></div>
                </div>
              )}
              <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <h2 className="text-lg font-medium text-orange-600 animate-pulse">Scanning Receipt...</h2>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold">Review AI Extraction</h2>
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Some items weren't clear. Please fix the highlighted fields.
                </p>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border ${
                      item.confidence === "low" ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemEdit(item.id, "name", e.target.value)}
                        className={`flex-1 bg-transparent font-medium focus:outline-none ${
                          item.confidence === "low" ? "text-red-700 underline decoration-dashed" : ""
                        }`}
                      />
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">₹</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemEdit(item.id, "price", e.target.value)}
                          className="w-16 bg-transparent text-right focus:outline-none font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep("split")}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition-all mt-4"
              >
                Looks Good, Let's Split
              </button>
            </div>
          )}

          {/* STEP 4: SPLIT AMONG FRIENDS */}
          {step === "split" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Who ate what?</h2>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add friend's name..."
                  value={newFriend}
                  onChange={(e) => setNewFriend(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <button onClick={addFriend} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg font-semibold">
                  Add
                </button>
              </div>

              <div className="space-y-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="border border-gray-100 p-3 rounded-xl bg-white shadow-sm">
                    <div className="flex justify-between font-medium mb-2">
                      <span>{item.name}</span>
                      <span>₹{item.price}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {friends.map((friend) => (
                        <button
                          key={friend}
                          onClick={() => toggleAssign(item.id, friend)}
                          className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                            item.assignedTo.includes(friend)
                              ? "bg-orange-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {friend}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep("upi")}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Calculate Final Split
              </button>
            </div>
          )}

          {/* STEP 5: FINAL CALCULATION & LIVE UPI */}
          {step === "upi" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-center">Summary</h2>
              
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-3 border-b border-orange-200 pb-2">
                  <span>GST (5%)</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-slate-800">
                  <span>Grand Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* UPI Setup Section */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Your UPI Details (To receive money)
                </label>
                <input
                  type="text"
                  placeholder="Your Name (e.g., Your Name)"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="UPI ID (e.g., number@upi)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                />
              </div>

              {/* Individual Payment Links & QR Codes */}
              <div>
                <h3 className="font-semibold mb-3">Live Payment Links & QR Codes:</h3>
                <div className="space-y-3">
                  {Object.entries(getSplitData()).map(([friend, amount]) => {
                    if (friend === "Me" || amount <= 0) return null; // Skip self and 0 amounts
                    const paymentUrl = upiId ? generateUpiLink(amount) : "#";
                    
                    return (
                      <div key={friend} className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium block">{friend}</span>
                            <span className="font-bold text-orange-600 text-lg">₹{amount.toFixed(2)}</span>
                          </div>
                          
                          <a
                            href={paymentUrl}
                            onClick={(e) => {
                              if (!upiId) {
                                e.preventDefault();
                                alert("Please enter your UPI ID first to generate links!");
                              }
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                              upiId 
                                ? "bg-green-500 hover:bg-green-600 text-white shadow-md" 
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Pay on Mobile 📱
                          </a>
                        </div>

                        {/* QR Code fallback for Desktop users */}
                        {upiId && (
                          <div className="pt-2 border-t border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-400 mb-2">Or scan QR code using any UPI app:</p>
                            <QRCodeSVG value={paymentUrl} size={120} includeMargin={true} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <button
                onClick={() => {
                  setStep("upload");
                  setImagePreview(null);
                }}
                className="w-full text-center text-sm text-gray-400 mt-4 underline"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
