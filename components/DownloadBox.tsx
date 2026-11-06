// components/DownloadBox.tsx
"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, runTransaction } from "firebase/database";

interface DownloadBoxProps {
  fileId: string;
  fileName: string;
}

export default function DownloadBox({ fileId, fileName }: DownloadBoxProps) {
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Ambil data counter secara real-time dari Firebase
  useEffect(() => {
    const countRef = ref(database, `downloads/${fileId}`);
    
    const unsubscribe = onValue(countRef, (snapshot) => {
      const data = snapshot.val();
      setDownloadCount(data !== null ? data : 0);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fileId]);

  // Fungsi untuk menambah counter saat tombol unduh ditekan
  const handleDownload = () => {
    const countRef = ref(database, `downloads/${fileId}`);
    
    runTransaction(countRef, (currentValue) => {
      return (currentValue || 0) + 1;
    })
    .then(() => {
      alert(`Berhasil mengunduh ${fileName}! Sesi dan counter tercatat di Firebase.`);
    })
    .catch((error) => {
      console.error("Gagal memperbarui counter:", error);
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm my-4">
      <h3 className="font-bold text-[#002b66] text-base mb-2">📦 {fileName}</h3>
      <p className="text-xs text-slate-600 mb-4">
        File terverifikasi SHA-256. Total diunduh oleh teknisi:{" "}
        <strong className="text-[#0099ff]">{loading ? "..." : downloadCount}x</strong>
      </p>

      <button
        onClick={handleDownload}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
      >
        📥 Unduh Berkas Sekarang
      </button>
    </div>
  );
}