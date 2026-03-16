import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  ArrowLeft,
  PackagePlus,
  Warehouse,
  Search,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/Auth";
import { FaRupeeSign } from "react-icons/fa";

const MotionDiv = motion.div;

const styles = {
  page:{
    padding:"40px",
    minHeight:"100vh",
    fontFamily:"Inter, sans-serif",
    background:"linear-gradient(135deg,#eef2ff,#f8fafc)"
  },

  header:{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    marginBottom:"35px"
  },

  title:{
    display:"flex",
    alignItems:"center",
    gap:"10px",
    fontSize:"24px",
    fontWeight:"600",
    color:"#4f46e5"
  },

  backBtn:{
    display:"flex",
    alignItems:"center",
    gap:"6px",
    padding:"8px 14px",
    background:"#fff",
    border:"1px solid #e2e8f0",
    borderRadius:"8px",
    cursor:"pointer",
    transition:"0.2s"
  },

  card:{
    background:"#fff",
    borderRadius:"16px",
    padding:"26px",
    marginBottom:"28px",
    boxShadow:"0 8px 30px rgba(0,0,0,0.06)"
  },

  cardTitle:{
    fontWeight:"600",
    marginBottom:"15px",
    display:"flex",
    alignItems:"center",
    gap:"8px"
  },

  row:{
    display:"flex",
    gap:"20px",
    flexWrap:"wrap"
  },

  inputGroup:{
    display:"flex",
    flexDirection:"column",
    gap:"6px",
    flex:1
  },

  label:{
    fontSize:"13px",
    color:"#475569",
    fontWeight:"500"
  },

  input:{
    padding:"10px",
    borderRadius:"10px",
    border:"1px solid #e2e8f0",
    fontSize:"14px",
    outline:"none"
  },

  itemRow:{
    display:"grid",
    gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto",
    gap:"10px",
    marginBottom:"14px"
  },

  deleteBtn:{
    background:"#fee2e2",
    border:"none",
    borderRadius:"8px",
    padding:"8px",
    cursor:"pointer"
  },

  addBtn:{
    display:"flex",
    alignItems:"center",
    gap:"6px",
    padding:"10px 16px",
    background:"#eef2ff",
    borderRadius:"10px",
    border:"none",
    cursor:"pointer"
  },

  summaryBar:{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    marginTop:"10px",
    padding:"12px 16px",
    borderRadius:"10px",
    background:"#f1f5f9"
  },

  submitArea:{
    display:"flex",
    justifyContent:"flex-end",
    marginTop:"25px"
  },

  submitBtn:{
    background:"#4f46e5",
    color:"#fff",
    padding:"12px 30px",
    border:"none",
    borderRadius:"12px",
    cursor:"pointer",
    fontSize:"15px"
  },

  floatingAdd:{
    position:"fixed",
    bottom:"40px",
    right:"40px",
    background:"#4f46e5",
    color:"#fff",
    borderRadius:"50%",
    width:"60px",
    height:"60px",
    border:"none",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    boxShadow:"0 10px 25px rgba(79,70,229,0.4)",
    cursor:"pointer"
  }
};

function ManualStockIn({ navigate }) {

  const { axiosAPI } = useAuth();

  const [warehouses,setWarehouses]=useState([]);
  const [products,setProducts]=useState([]);
  const [warehouseId,setWarehouseId]=useState("");
  const [reason,setReason]=useState("");
  const [loading,setLoading]=useState(false);
  const [search,setSearch]=useState("");

  const [items,setItems]=useState([
    {productId:"",quantity:"",unit:"",unitCost:""}
  ]);

  useEffect(()=>{
    async function load(){
      const [w,p]=await Promise.all([
        axiosAPI.get("/warehouses",{params:{divisionId:"all"}}),
        axiosAPI.get("/products",{params:{divisionId:"all"}})
      ]);

      setWarehouses(w.data.warehouses);
      setProducts(p.data.products);
    }

    load();
  },[]);

  const filteredProducts=useMemo(()=>{
    return products.filter(p=>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.SKU.toLowerCase().includes(search.toLowerCase())
    );
  },[products,search]);

  const handleProductSelect=(index,id)=>{

    const product=products.find(p=>p.id==id);

    const updated=[...items];

    updated[index].productId=id;
    updated[index].unit=product.defaultUnit || product.unit;
    updated[index].unitCost=product.purchasePrice;

    setItems(updated);
  };

  const handleChange=(index,field,val)=>{
    const updated=[...items];
    updated[index][field]=val;
    setItems(updated);
  };

  const addRow=()=>{
    setItems([...items,{productId:"",quantity:"",unit:"",unitCost:""}]);
  };

  const removeRow=index=>{
    setItems(items.filter((_,i)=>i!==index));
  };

  const totalValue=useMemo(()=>{
    return items.reduce((sum,i)=>sum+(i.quantity*i.unitCost||0),0);
  },[items]);

  const handleSubmit=async()=>{

    const payload={
      warehouseId:Number(warehouseId),
      reason,
      items:items.map(i=>({
        productId:Number(i.productId),
        quantity:Number(i.quantity),
        unit:i.unit,
        unitCost:Number(i.unitCost)
      }))
    };

    try{

      setLoading(true);

      await axiosAPI.post("/warehouse/inventory/manual-stock-in",payload);

      alert("Stock added successfully");

      setItems([{productId:"",quantity:"",unit:"",unitCost:""}]);

    }catch(err){
      alert(err?.response?.data?.message || "Failed");
    }

    setLoading(false);
  };

  return(
    <div style={styles.page}>

      {/* HEADER */}

      <MotionDiv style={styles.header} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}>

        <div style={styles.title}>
          <PackagePlus size={28}/>
          Manual Stock In
        </div>

        <button style={styles.backBtn} onClick={()=>navigate("/inventory")}>
          <ArrowLeft size={18}/> Back
        </button>

      </MotionDiv>


      {/* BASIC DETAILS */}

      <MotionDiv style={styles.card}>

        <div style={styles.cardTitle}>
          <Warehouse size={18}/>
          Warehouse Details
        </div>

        <div style={styles.row}>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Warehouse</label>
            <select style={styles.input} value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>
              <option value="">Select warehouse</option>
              {warehouses.map(w=>(
                <option key={w.id} value={w.id}>
                  {w.name} — {w.city}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Reason</label>
            <input
              style={styles.input}
              value={reason}
              onChange={e=>setReason(e.target.value)}
              placeholder="Manual stock reason"
            />
          </div>

        </div>

      </MotionDiv>


      {/* PRODUCTS */}

      <MotionDiv style={styles.card}>

        <div style={styles.cardTitle}>
          <Search size={18}/>
          Add Products
        </div>

        <input
          style={{...styles.input,marginBottom:"15px"}}
          placeholder="Search products by name or SKU..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />

        <AnimatePresence>

        {items.map((item,index)=>{

          const product=products.find(p=>p.id==item.productId);

          const units=product?.unitPrices?.map(u=>u.unit)||[];

          return(

            <MotionDiv
              key={index}
              style={styles.itemRow}
              initial={{opacity:0,y:10}}
              animate={{opacity:1,y:0}}
              exit={{opacity:0}}
            >

              <select
                style={styles.input}
                value={item.productId}
                onChange={e=>handleProductSelect(index,e.target.value)}
              >

                <option value="">Select product</option>

                {filteredProducts.map(p=>(
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.SKU})
                  </option>
                ))}

              </select>

              <input
                style={styles.input}
                type="number"
                value={item.quantity}
                placeholder="Qty"
                onChange={e=>handleChange(index,"quantity",e.target.value)}
              />

              <select
                style={styles.input}
                value={item.unit}
                onChange={e=>handleChange(index,"unit",e.target.value)}
              >
                {units.map(u=>(
                  <option key={u}>{u}</option>
                ))}
              </select>

              <input
                style={styles.input}
                type="number"
                value={item.unitCost}
                onChange={e=>handleChange(index,"unitCost",e.target.value)}
              />

              <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <FaRupeeSign size={16}/>
                {(item.quantity*item.unitCost||0).toFixed(2)}
              </div>

              <button style={styles.deleteBtn} onClick={()=>removeRow(index)}>
                <Trash2 size={16}/>
              </button>

            </MotionDiv>

          )

        })}

        </AnimatePresence>

        <button style={styles.addBtn} onClick={addRow}>
          <Plus size={16}/> Add Item
        </button>

        <div style={styles.summaryBar}>
          <span>Total Inventory Value</span>
          <strong>₹ {totalValue.toFixed(2)}</strong>
        </div>

      </MotionDiv>


      <div style={styles.submitArea}>
        <button style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Processing..." : "Confirm Stock In"}
        </button>
      </div>


      {/* FLOATING BUTTON */}

      <button style={styles.floatingAdd} onClick={addRow}>
        <Plus size={26}/>
      </button>

    </div>
  );
}

export default ManualStockIn;