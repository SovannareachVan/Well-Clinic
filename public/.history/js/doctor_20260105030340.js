import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import LoadingSpinner from "./LoadingSpinner";
import Swal from "sweetalert2"; 
import { User, Edit3, Trash2, ArrowRight, UserPlus } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Load Patients from Firebase
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "patients"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(list);
        setFilteredPatients(list);
      } catch (err) {
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Search Filter Logic
  useEffect(() => {
    const filtered = patients.filter((p) => {
      const name = p.name ? p.name.toLowerCase() : "";
      const search = searchTerm ? searchTerm.toLowerCase() : "";
      return name.includes(search);
    });
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const handleDeletePatient = async (patientId, patientName) => {
    const result = await Swal.fire({
      title: "តើអ្នកប្រាកដទេ?",
      text: `រាល់ទិន្នន័យទាំងអស់របស់ ${patientName || "អ្នកជំងឺនេះ"} នឹងត្រូវលុបបាត់ទាំងស្រុង!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "បាទ លុបចេញ!",
      cancelButtonText: "បោះបង់",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'កំពុងលុបទិន្នន័យ...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      try {
        const functions = getFunctions();
        const deletePatientFunc = httpsCallable(functions, 'deletePatientCompletely');
        await deletePatientFunc({ patientId });
        setPatients(prev => prev.filter((p) => p.id !== patientId));
        Swal.fire({ title: "ជោគជ័យ!", icon: "success", confirmButtonColor: "#10b981" });
      } catch (err) {
        Swal.fire("Error", "មិនអាចលុបទិន្នន័យបានទេ", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <LoadingSpinner />
        <p className="mt-4 text-gray-400 font-bold animate-pulse text-xs tracking-widest uppercase">Loading Patients...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-relaxed">
            បញ្ជីអ្នកជំងឺ <span className="text-blue-600 font-medium text-xl md:text-2xl ml-2">Patients</span>
          </h2>
          <p className="text-gray-500 text-base font-medium mt-1">
            សរុប {patients.length} នាក់
            {filteredPatients.length !== patients.length && ` • ឃើញ ${filteredPatients.length} នាក់`}
          </p>
        </div>
        <div className="w-full md:w-80">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <h3 className="text-2xl font-bold text-gray-700 mb-4">មិនទាន់មានទិន្នន័យអ្នកជំងឺ</h3>
          <Link to="/add-patient" className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-bold transition-all shadow-lg">
            <UserPlus className="w-6 h-6" /> បន្ថែមអ្នកជំងឺថ្មី
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredPatients.map((p, index) => (
            <div key={p.id} className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden">
              
              {/* Profile Banner */}
              <div className="relative h-28 bg-gradient-to-br from-slate-50 to-blue-50/50">
                
                {/* Numbering Badge */}
                <div className="absolute top-4 left-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-blue-600 font-black text-base shadow-sm border border-blue-50">
                    {index + 1}
                  </span>
                </div>

                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                  <div className="w-24 h-24 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50"><User className="w-10 h-10 text-gray-200" /></div>
                    )}
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                   <span className={`text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider ${p.sex === "ប្រុស" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                     {p.sex || "N/A"}
                   </span>
                </div>
              </div>

              {/* Patient Details */}
              <div className="pt-14 pb-8 px-6">
                <h3 className="text-[22px] font-bold text-gray-900 text-center truncate leading-relaxed mb-1">
                   {p.name || "មិនមានឈ្មោះ"}
                </h3>
                <p className="text-[11px] font-bold text-gray-400 text-center uppercase tracking-[0.25em] mb-6">Patient Profile</p>

                <div className="space-y-4 mb-8 bg-slate-50 p-5 rounded-[2rem]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">ទូរស័ព្ទ</span>
                    <span className="text-sm font-bold text-gray-800">{p.phone || "---"}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200/50 pt-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">អាយុ</span>
                    <span className="text-sm font-bold text-gray-800">{p.age || "---"} ឆ្នាំ</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Link to={`/edit/${p.id}`} className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all font-bold text-sm shadow-sm">
                    <Edit3 className="w-4 h-4" /> កែប្រែ
                  </Link>
                  <button onClick={() => handleDeletePatient(p.id, p.name)} className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-100 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm shadow-sm">
                    <Trash2 className="w-4 h-4" /> លុប
                  </button>
                </div>

                <Link to={`/view/${p.id}`} className="flex items-center justify-center gap-2 w-full py-3 text-blue-600 font-bold text-xs uppercase tracking-[0.2em] hover:bg-blue-50 rounded-2xl transition-all">
                  មើលលម្អិត <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}