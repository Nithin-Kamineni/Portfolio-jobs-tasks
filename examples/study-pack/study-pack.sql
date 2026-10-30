-- Optional example study pack for the Tasks app (Interview prep, Flashcards, Quiz, Questions): a computer-architecture /
-- chip-design curriculum with ~500 flashcards, ~350 quiz questions and ~170 interview questions. All progress is empty.
-- Load it once: cd site && npx wrangler d1 execute DB --local --file ../examples/study-pack/study-pack.sql  (--remote for the live site)
-- Every row uses INSERT OR IGNORE, so loading it twice changes nothing. Sources are in each question's "source" column.

INSERT OR IGNORE INTO prep_tracks(id,position,title,summary,goal,suggested,hidden) VALUES('arch',1,'Computer architecture','Onur Mutlu (ETH): all of DDCA Spring 2026, plus the Fall 2025 / Spring 2025 lectures on topics DDCA does not cover.','Digital design through caches, virtual memory and GPUs, then memory systems, memory-centric computing, robustness, coherence, interconnects and speculation: whiteboard any of it in an interview.',0,0);
INSERT OR IGNORE INTO prep_tracks(id,position,title,summary,goal,suggested,hidden) VALUES('mlir',2,'MLIR','A 2026 two-part tutorial to sharpen vocabulary, 2023–2026 LLVM-meeting talks on the tensor-compiler path and industry NPU stacks, and a 2-hour LLVM module (IR, optimizer passes, SelectionDAG backend).','Explain dialects, regions/SSA, rewriting and dialect conversion, linalg tiling/fusion, bufferization and transform-dialect schedules crisply; explain LLVM IR, how passes run and how a backend selects instructions;',0,0);
INSERT OR IGNORE INTO prep_tracks(id,position,title,summary,goal,suggested,hidden) VALUES('soc',3,'SoC design','Adi Teman''s SoC 101, the whole playlist (~11 h of short lectures), plus short PCIe, CXL and AMBA clips.','Explain how an SoC is put together: ISA to assembly, buses and interconnect, peripherals and DMA, memory hierarchy, the OS view, and post-silicon bring-up.',0,0);
INSERT OR IGNORE INTO prep_tracks(id,position,title,summary,goal,suggested,hidden) VALUES('vlsi',4,'VLSI basics','One series: Adi Teman''s Digital Integrated Circuits (Bar-Ilan, 2020–21), about 5 hours: chip flow → MOSFET → inverter delay/power → flip-flops, setup/hold and STA → 6T SRAM.','Explain what a MOSFET and a CMOS inverter do, where delay and dynamic/leakage power come from, compute setup/hold slack, name the standard-cell flow steps (synthesis, place & route, CTS, STA, signoff), and explain 6T SRAM read/write and stability (the basis of SRAM CIM).',0,0);
INSERT OR IGNORE INTO prep_tracks(id,position,title,summary,goal,suggested,hidden) VALUES('rtl',5,'RTL design, CDC & timing','The RTL interview core in one place: coding rules (blocking/nonblocking, latches, resets, FSMs), datapath blocks (FIFOs, arbiters, valid/ready), the three CDC methods, STA (setup, hold, fmax) with Greg Stitt''s FPGA Timing Optimization series, and verification basics. Pairs with the HDL coding roadmap.','Write a sync FIFO, round-robin arbiter, skid buffer and FSM from scratch; pick the right CDC method (2-flop sync, req/ack handshake, Gray-pointer async FIFO) and explain metastability and MTBF; compute setup/hold slack and fmax with skew in your head and name the RTL fixes for a failing path; sketch a UVM testbench and write basic SVA.',0,0);
INSERT OR IGNORE INTO prep_tracks(id,position,title,summary,goal,suggested,hidden) VALUES('gpu',6,'GPU basics','Mutlu''s 2026 GPU lecture, a 20-minute 2026 H100 walk-through and Stanford CS336 (Spring 2026) GPUs/TPUs; then the CUDA/Triton programming model (NVIDIA GTC 2025, CS336 L6, a 2026 Triton tutorial) and modern attention kernels (Tri Dao on FlashAttention-2/3, GPU MODE on FlashInfer).','Explain SIMT, warps, divergence, occupancy and latency hiding, the GPU memory hierarchy, tensor cores and a tiled GEMM; write and explain a simple CUDA kernel and its Triton equivalent; explain what FlashAttention-2/3 and split-KV decode kernels (Flash-Decoding, FlashInfer) change.',0,0);
INSERT OR IGNORE INTO prep_tracks(id,position,title,summary,goal,suggested,hidden) VALUES('mlsys',7,'ML systems & new AI architectures','"The Engineering Behind LLM Inference" (2026 series) for the inference stack, plus Stanford CS336 (Spring 2026) for architectures and attention alternatives.','Explain attention and its cost, KV-cache sizing, prefill vs decode, FlashAttention, PagedAttention/continuous batching, MoE, SSM/Mamba and quantization in terms of memory traffic (your PIM angle).',0,0);
INSERT OR IGNORE INTO prep_tracks(id,position,title,summary,goal,suggested,hidden) VALUES('accel',8,'ML accelerators & dataflows','Systolic arrays (Mutlu, Fall 2025), DNN dataflow taxonomy (ECE 60827 lecture), roofline, and Hot Chips 2025 ML sessions (Ironwood TPU, MI350, GB10, d-Matrix CIM).','Map a GEMM onto a systolic array, compare weight/output/row-stationary dataflows, reason with the roofline, and discuss current commercial accelerators including an in-memory-computing chiplet.',0,0);
INSERT OR IGNORE INTO prep_tracks(id,position,title,summary,goal,suggested,hidden) VALUES('os',9,'Operating systems','ECE344 Fall 2024 (University of Toronto), the whole lecture series (~25 h), plus two short Linux-driver videos.','Processes, scheduling, virtual memory and page tables, threads and synchronization, file systems, memory allocation: explain each and the hardware support it needs.',0,0);
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('accel-x1','accel',1,'Systolic arrays and dataflows');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('accel-x2','accel',2,'Real accelerators (Hot Chips 2025)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('arch-p1','arch',1,'DDCA 2026 · Digital design, Verilog, timing (L1–L6)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('arch-p2','arch',2,'DDCA 2026 · ISA and microarchitecture (L7–L10)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('arch-p3','arch',3,'DDCA 2026 · Pipelining and exceptions (L11–L13)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('arch-p4','arch',4,'DDCA 2026 · Out-of-order, superscalar, branch prediction, VLIW, systolic, SIMD (L14–L19)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('arch-p5','arch',5,'DDCA 2026 · GPUs, memory, caches, prefetching, virtual memory (L20–L26)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('arch-p6','arch',6,'DDCA 2026 · Problem-solving lectures (L27–L33)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('arch-x1','arch',7,'Comp Arch Fall 2025 · memory systems (not in DDCA)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('arch-x2','arch',8,'Comp Arch Fall 2025 · prefetchers, multiprocessors, interconnects, speculation (not in DDCA)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('gpu-g1','gpu',1,'GPU architecture');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('gpu-g2','gpu',2,'GPUs and TPUs for ML');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('gpu-g3','gpu',3,'CUDA and Triton: the programming model');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('gpu-g4','gpu',4,'Modern attention kernels');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('mlir-m1','mlir',1,'Core concepts, said cleanly');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('mlir-m2','mlir',2,'The tensor-compiler pipeline');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('mlir-m4','mlir',3,'LLVM underneath MLIR');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('mlir-m3','mlir',4,'Industry accelerator stacks and PIM');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('mlir-m5','mlir',5,'Other ML compilers: TVM and XLA vs MLIR');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('mlsys-l1','mlsys',1,'Transformers and modern architectures');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('mlsys-l2','mlsys',2,'Inference engineering');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('mlsys-l3','mlsys',3,'Toolchain one-liners and a sizing drill');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('os-u1','os',1,'ECE344 · Why OSes, kernels, libraries');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('os-u2','os',2,'ECE344 · Processes');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('os-u3','os',3,'ECE344 · Scheduling');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('os-u4','os',4,'ECE344 · Virtual memory and page tables');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('os-u5','os',5,'ECE344 · Threads, locks, semaphores');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('os-u6','os',6,'ECE344 · Sockets');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('os-u7','os',7,'ECE344 · Disks and file systems');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('os-u8','os',8,'ECE344 · Page replacement and memory allocation');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('os-u9','os',9,'ECE344 · Virtual machines and reviews');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('os-extra','os',10,'Short add-ons: Linux drivers and DMA');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('rtl-m1','rtl',1,'RTL fundamentals: combinational, sequential, FSMs');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('rtl-m2','rtl',2,'Datapath blocks: FIFOs, arbiters, valid/ready, memories');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('rtl-m3','rtl',3,'CDC & metastability');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('rtl-m4','rtl',4,'Static timing analysis: setup, hold, fmax');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('rtl-m5','rtl',5,'Verification basics (SV/UVM)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('soc-l1','soc',1,'SoC 101 · Introduction and embedded systems');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('soc-l2','soc',2,'SoC 101 · The microprocessor and the ISA');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('soc-l3','soc',3,'SoC 101 · From C to RISC-V assembly');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('soc-l4','soc',4,'SoC 101 · On-chip interconnect and buses');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('soc-l5','soc',5,'SoC 101 · Peripherals, offloading (DMA) and memory');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('soc-l6','soc',6,'SoC 101 · Memory hierarchy, caches, virtual memory');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('soc-l7','soc',7,'SoC 101 · Operating systems on an SoC');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('soc-l8','soc',8,'SoC 101 · Post-silicon bring-up and debug');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('soc-extra','soc',9,'Short add-ons: PCIe, CXL, AMBA (AXI/CHI)');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('soc-fw','soc',10,'Embedded firmware & HW/SW co-design');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('vlsi-v0','vlsi',1,'The map: how a chip is made');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('vlsi-v1','vlsi',2,'MOSFET, CMOS inverter, delay and power');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('vlsi-v2','vlsi',3,'Sequential timing and STA');
INSERT OR IGNORE INTO prep_modules(id,track_id,position,title) VALUES('vlsi-v4','vlsi',4,'SRAM');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('accel-x1-1','accel-x1',1,'Computer Architecture L28: Systolic Array Architectures (Fall 2025)','video','https://www.youtube.com/watch?v=jll-Xc9Gpnw&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',0.75,0,'TPU-style matrix unit from first principles.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('accel-x1-2','accel-x1',2,'ECE 60827 Lecture 22: DNN Accelerator Dataflow','video','https://www.youtube.com/watch?v=_egguU92XtQ&list=PLX58zj6F-D_v96QZTui1dcpNAzw-_bI41',1.5,0,'Weight/output/input/row stationary, data reuse, Eyeriss.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('accel-x1-3','accel-x1',3,'A very short intro to the Roofline model (NHR@FAU)','video','https://www.youtube.com/watch?v=IrkNZG8MJ64',0.25,0,'Operational intensity, ridge point.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('accel-x2-1','accel-x2',1,'Hot Chips 2025 Session 8: Machine Learning 2 (NVIDIA GB10, AMD MI350/CDNA 4, Google Ironwood TPU)','video','https://www.youtube.com/watch?v=Zy3LfsAxc64&list=PLaKG44ao8ZnGI25hV7XYMM88Q1eGmsqTC',1.75,0,'Ironwood is the current TPU reference.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('accel-x2-2','accel-x2',2,'Hot Chips 2025 Session 7: Machine Learning 1 (Marvell on memory, d-Matrix Corsair in-memory computing, Huawei UB-Mesh)','video','https://www.youtube.com/watch?v=p97UkNh2oPc&list=PLaKG44ao8ZnGI25hV7XYMM88Q1eGmsqTC',1.75,0,'d-Matrix is the commercial SRAM-CIM comparison point for your work.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('accel-x2-3','accel-x2',3,'Map a 1024x1024 GEMM onto a 128x128 weight-stationary array: cycles, utilization, SRAM traffic; place it on a roofline','exercise','',0.75,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-M2rdcGH53k4','arch-p1',1,'Introduction: Fundamentals, Transistors, Gates','video','https://www.youtube.com/watch?v=M2rdcGH53k4&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.96,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-EbvYrjx26QI','arch-p1',2,'Transistors, Gates, Combinational Logic','video','https://www.youtube.com/watch?v=EbvYrjx26QI&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.86,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-F0bK_Wu71i4','arch-p1',3,'Combinational Logic II & Sequential Logic','video','https://www.youtube.com/watch?v=F0bK_Wu71i4&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.84,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-CrAzN0ymgPU','arch-p1',4,'Sequential Logic Design & Finite State Machines','video','https://www.youtube.com/watch?v=CrAzN0ymgPU&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.94,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-VBCA0i0lNk4','arch-p1',5,'Problem-Solving Session 1','video','https://www.youtube.com/watch?v=VBCA0i0lNk4&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.41,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-pBqAzwltquY','arch-p1',6,'Hardware Description Languages and Verilog','video','https://www.youtube.com/watch?v=pBqAzwltquY&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.84,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-smY30P4inhk','arch-p1',7,'Timing & Verification','video','https://www.youtube.com/watch?v=smY30P4inhk&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.85,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-7FZ-A4wMXlk','arch-p1',8,'Verification & Testing','video','https://www.youtube.com/watch?v=7FZ-A4wMXlk&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.51,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-kwrlfoUC2IM','arch-p1',9,'Problem-Solving Session 2','video','https://www.youtube.com/watch?v=kwrlfoUC2IM&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.44,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-fOl5MLoUzco','arch-p2',1,'Von Neumann Model & Instruction Set Architectures','video','https://www.youtube.com/watch?v=fOl5MLoUzco&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.8,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-n4wUE6H8tCU','arch-p2',2,'Instruction Set Architectures II','video','https://www.youtube.com/watch?v=n4wUE6H8tCU&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.49,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-r9uLvLZzQyc','arch-p2',3,'Problem-Solving Session 3','video','https://www.youtube.com/watch?v=r9uLvLZzQyc&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.68,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-tp70062TXG8','arch-p2',4,'ISA and Microarchitecture','video','https://www.youtube.com/watch?v=tp70062TXG8&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.77,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-Tqc3XRJB9js','arch-p2',5,'Assembly Programming','video','https://www.youtube.com/watch?v=Tqc3XRJB9js&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.67,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-ZALI3HY3Zrs','arch-p2',6,'Microarchitecture Fundamentals and Design','video','https://www.youtube.com/watch?v=ZALI3HY3Zrs&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.8,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-05SHU6vh1N4','arch-p2',7,'Problem-Solving Session 4','video','https://www.youtube.com/watch?v=05SHU6vh1N4&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.64,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-x64SoeZ5O4M','arch-p3',1,'Multi-Cycle and Pipelined Processor Design','video','https://www.youtube.com/watch?v=x64SoeZ5O4M&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.78,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a1-1','arch-p3',2,'Pipelined Processor Design','video','https://www.youtube.com/watch?v=EX05tV1iH9I&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.79,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-FbUu2oNcBz4','arch-p3',3,'Problem-Solving Session 5','video','https://www.youtube.com/watch?v=FbUu2oNcBz4&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.42,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-TH386wzOXvA','arch-p3',4,'Precise Exceptions & Interrupts','video','https://www.youtube.com/watch?v=TH386wzOXvA&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.77,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-DD1y1w-Ar8Q','arch-p3',5,'Problem-Solving Session 6','video','https://www.youtube.com/watch?v=DD1y1w-Ar8Q&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.59,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a1-2','arch-p4',1,'Out-of-Order Execution','video','https://www.youtube.com/watch?v=9M1Jdw16Un0&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.84,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a1-4','arch-p4',2,'Dataflow, Superscalar Execution & Branch Prediction','video','https://www.youtube.com/watch?v=2OQPmdvUmO4&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.8,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-nx4E34TV8S4','arch-p4',3,'Problem-Solving Session 7','video','https://www.youtube.com/watch?v=nx4E34TV8S4&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.63,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-cSlzoF4VASs','arch-p4',4,'Out-of-Order Execution','video','https://www.youtube.com/watch?v=cSlzoF4VASs&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.61,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a1-3','arch-p4',5,'Load-Store Handling in Out-of-Order Execution','video','https://www.youtube.com/watch?v=AuwdX-5NO9A&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.41,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-2UgcdfsY7ks','arch-p4',6,'Branch Prediction','video','https://www.youtube.com/watch?v=2UgcdfsY7ks&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.79,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-BsMxHdxgoos','arch-p4',7,'VLIW and Systolic Array Architectures','video','https://www.youtube.com/watch?v=BsMxHdxgoos&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.82,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-3tt1Hsnm6-c','arch-p4',8,'Problem-Solving Session 8','video','https://www.youtube.com/watch?v=3tt1Hsnm6-c&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.62,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a3-1','arch-p4',9,'SIMD Architectures','video','https://www.youtube.com/watch?v=77DqS3jWOtk&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.79,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-f3Rq2tGbuUg','arch-p4',10,'Decoupled Access-Execute','video','https://www.youtube.com/watch?v=f3Rq2tGbuUg&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.2,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-CSsp9gZQrUE','arch-p4',11,'Problem-Solving Session 9','video','https://www.youtube.com/watch?v=CSsp9gZQrUE&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.71,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g1-1','arch-p5',1,'GPU Architectures','video','https://www.youtube.com/watch?v=aE0onltJlOo&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.78,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a2-1','arch-p5',2,'Memory Overview, Technology, Organization, Hierarchy','video','https://www.youtube.com/watch?v=cpff0y2OqrI&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.78,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-m3RYYOH_xWU','arch-p5',3,'GPU Programming','video','https://www.youtube.com/watch?v=m3RYYOH_xWU&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',2.54,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-YFJMhObZaGk','arch-p5',4,'Problem-Solving Session 10','video','https://www.youtube.com/watch?v=YFJMhObZaGk&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.59,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a2-2','arch-p5',5,'Memory Hierarchy and Caches','video','https://www.youtube.com/watch?v=l2_TNDtrafI&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.85,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-AxpMENs9VEM','arch-p5',6,'Problem-Solving Session 11','video','https://www.youtube.com/watch?v=AxpMENs9VEM&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.45,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a2-3','arch-p5',7,'Cache Design, Management, and Tradeoffs','video','https://www.youtube.com/watch?v=_CzOaPRjt4Q&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.81,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a2-4','arch-p5',8,'Prefetching','video','https://www.youtube.com/watch?v=5dzzhFV4IlY&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.81,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-UFs7Av3hANk','arch-p5',9,'Problem-Solving Session 12','video','https://www.youtube.com/watch?v=UFs7Av3hANk&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.62,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a2-5','arch-p5',10,'Prefetching II & Virtual Memory','video','https://www.youtube.com/watch?v=2x4oK-ovrAQ&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.82,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-pPQjdD6br4I','arch-p5',11,'Virtual Memory II & Epilogue','video','https://www.youtube.com/watch?v=pPQjdD6br4I&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',1.82,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-7e1af8yUW10','arch-p5',12,'Problem-Solving Session 13','video','https://www.youtube.com/watch?v=7e1af8yUW10&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',0.47,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-5ybhEMPUFok','arch-p6',1,'Problem Solving II','video','https://www.youtube.com/watch?v=5ybhEMPUFok&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',4.12,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-U1dhvcZ-f_M','arch-p6',2,'Problem Solving I','video','https://www.youtube.com/watch?v=U1dhvcZ-f_M&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',2.84,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-F2rc28K_xY4','arch-p6',3,'Problem Solving III','video','https://www.youtube.com/watch?v=F2rc28K_xY4&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',2.85,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-5b--mxHnDc0','arch-p6',4,'Problem Solving IV','video','https://www.youtube.com/watch?v=5b--mxHnDc0&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',3.83,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-2ste61kbVec','arch-p6',5,'Problem Solving V','video','https://www.youtube.com/watch?v=2ste61kbVec&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',4.53,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-3kdrI4ZcP84','arch-p6',6,'Problem Solving VI','video','https://www.youtube.com/watch?v=3kdrI4ZcP84&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',3.31,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-p-v1XcXXKbxsA','arch-p6',7,'Problem Solving VII','video','https://www.youtube.com/watch?v=v1XcXXKbxsA&list=PL5Q2soXY2Zi-yo9kK-BKrq11ykNKkVEpd',3.08,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-VWj2Krqxrnw','arch-x1',1,'Memory Systems and Course Logistics','video','https://www.youtube.com/watch?v=VWj2Krqxrnw&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.81,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-GhcInKOsDqk','arch-x1',2,'Memory Systems: Challenges and Opportunities','video','https://www.youtube.com/watch?v=GhcInKOsDqk&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.79,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a4-1','arch-x1',3,'Memory-Centric Computing I','video','https://www.youtube.com/watch?v=3P_ZkIwRgLE&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.68,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-XUZHVrlmCCU','arch-x1',4,'Memory-Centric Computing II','video','https://www.youtube.com/watch?v=XUZHVrlmCCU&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.64,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-I5nm_h-GaWQ','arch-x1',5,'Memory-Centric Computing III','video','https://www.youtube.com/watch?v=I5nm_h-GaWQ&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.56,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-EHt3M3s2y40','arch-x1',6,'Data Retention in Memory','video','https://www.youtube.com/watch?v=EHt3M3s2y40&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.74,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-SxHLh0UD5xE','arch-x1',7,'Memory Latency','video','https://www.youtube.com/watch?v=SxHLh0UD5xE&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.77,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-q-rBRYTKPwc','arch-x1',8,'Memory Latency II and Memory Controllers','video','https://www.youtube.com/watch?v=q-rBRYTKPwc&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.78,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-PL9i3PgYpnw','arch-x1',9,'Memory Controllers II, Service Quality and Performance','video','https://www.youtube.com/watch?v=PL9i3PgYpnw&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.83,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-N82rlxiRfYM','arch-x1',10,'Memory Controllers: Service Quality and Performance II','video','https://www.youtube.com/watch?v=N82rlxiRfYM&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.69,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a4-2','arch-x1',11,'Memory Robustness I','video','https://www.youtube.com/watch?v=uqV-43ysc44&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.52,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-7KMJU3TJ44o','arch-x1',12,'Memory Robustness II','video','https://www.youtube.com/watch?v=7KMJU3TJ44o&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.64,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-KKGRhwfcq48','arch-x1',13,'Cutting-Edge Research in Memory Robustness & Security','video','https://www.youtube.com/watch?v=KKGRhwfcq48&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.95,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-D89ae39HwOY','arch-x1',14,'Emerging Memory Technologies','video','https://www.youtube.com/watch?v=D89ae39HwOY&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.75,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-3QxunKWbNiI','arch-x1',15,'Flash Memory and Solid-State Drives','video','https://www.youtube.com/watch?v=3QxunKWbNiI&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.84,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-gaGmNeD5pns','arch-x1',16,'Flash Memory and Solid-State Drives II','video','https://www.youtube.com/watch?v=gaGmNeD5pns&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.76,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-lJ5UpGvdm4Y','arch-x2',1,'Simulation and Prefetching','video','https://www.youtube.com/watch?v=lJ5UpGvdm4Y&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.78,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-ZmlBbyTEm9U','arch-x2',2,'Prefetching and Prefetcher Design II','video','https://www.youtube.com/watch?v=ZmlBbyTEm9U&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.65,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-vN8xRnjT8wA','arch-x2',3,'Prefetching III and Multiprocessors','video','https://www.youtube.com/watch?v=vN8xRnjT8wA&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.75,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a3-2','arch-x2',4,'Multiprocessors II, Memory Ordering and Cache Coherence','video','https://www.youtube.com/watch?v=T2LxWfefhsc&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.84,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-a3-3','arch-x2',5,'Interconnects','video','https://www.youtube.com/watch?v=yDnAJfiPY-E&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.79,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-Kduwu_soNuU','arch-x2',6,'On-Chip Networks & Router Design','video','https://www.youtube.com/watch?v=Kduwu_soNuU&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.78,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-9SJ2hQWU9A0','arch-x2',7,'Accelerating Biological Sequence Analysis','video','https://www.youtube.com/watch?v=9SJ2hQWU9A0&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',2.13,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-_iltf2OC_K0','arch-x2',8,'Parallelism, Heterogeneity, and Bottleneck Acceleration','video','https://www.youtube.com/watch?v=_iltf2OC_K0&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',3.64,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('arch-x-tyYOsCpbK0E','arch-x2',9,'Speculation','video','https://www.youtube.com/watch?v=tyYOsCpbK0E&list=PL5Q2soXY2Zi8tTLVb-9CUHcfKXLWESjOD',3.43,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g1-2','gpu-g1',1,'The Engineering Behind LLM Inference: Inside the GPU (2026)','video','https://www.youtube.com/watch?v=cbEhkd4ZeKs&list=PLqO45Dg1pMhlDBZTMqVL2GU-14xYip2y2',0.5,0,'H100 SM, tensor cores, memory hierarchy in 20 minutes.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g2-1','gpu-g2',1,'Stanford CS336 (Spring 2026) Lecture 5: GPUs, TPUs','video','https://www.youtube.com/watch?v=izZba4UA7iY&list=PLoROMvodv4rMqXOcazWaTUHhq-yembLCV',1.5,0,'Roofline, tiling, coalescing; TPU contrast. (Embedding disabled by Stanford: opens on YouTube.)');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g2-2','gpu-g2',2,'Explain aloud: warp divergence, coalescing, occupancy, shared-memory tiled GEMM; GPU tensor core vs TPU systolic array','exercise','',0.5,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g3-1','gpu-g3',1,'Getting Started with CUDA and Parallel Programming (NVIDIA GTC 2025)','video','https://www.youtube.com/watch?v=GmNkYayuaA4',0.75,0,'Kernels, grid/block/thread indexing, host vs device memory, launch configuration, from NVIDIA. Pairs with the DDCA GPU lecture.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g3-2','gpu-g3',2,'Stanford CS336 (Spring 2026) Lecture 6: Kernels, Triton, XLA','video','https://www.youtube.com/watch?v=xnDHaNUvHBg&list=PLoROMvodv4rMqXOcazWaTUHhq-yembLCV',1.5,0,'Writing and benchmarking kernels; shared-memory tiling and fusion; Triton''s block-level model vs CUDA''s thread-level model; where compilers fit. (Embedding disabled by Stanford: opens on YouTube.)');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g3-3','gpu-g3',3,'Triton GPU Programming From Scratch, Tutorial (Vuk Rosić, 2026)','video','https://www.youtube.com/watch?v=LMU0LrX1f88',0.5,0,'Short hands-on: program_id, BLOCK_SIZE, arange, masks, loads/stores. Code along once in Colab.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g3-5','gpu-g3',4,'AMD HIP Tutorial 1-5: What is HIP (Yifan&GPU, 2024)','video','https://www.youtube.com/watch?v=vyNT8JRii-0',0.25,0,'HIP is AMD''s CUDA-like C++ API on ROCm: near one-to-one with CUDA (hipMalloc, hipLaunchKernelGGL / <<<>>>), HIPIFY ports CUDA source, and HIP code can also compile for NVIDIA GPUs. Wavefronts of 64 on CDNA vs warps of 32.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g3-6','gpu-g3',5,'Lightning Talk: Harnessing NVIDIA Tensor Cores, an Exploration of CUTLASS and OpenAI Triton (Matthew Nicely, NVIDIA, PyTorch Conf 2023)','video','https://www.youtube.com/watch?v=yCyZEJrlrfY',0.25,0,'CUTLASS = NVIDIA''s open-source CUDA C++ template library (CuTe layouts underneath) for building tensor-core GEMM/conv kernels; sits between hand-written CUDA and cuBLAS, and Triton is the Python-level alternative. Kernel-optimization basics (coalescing, tiling, occupancy) are already in CS336 L5/L6, so no extra video for them.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g3-4','gpu-g3',6,'Explain aloud: vector add and row-softmax in CUDA (threads) and in Triton (blocks): grid size, indexing, masking, which memory each value lives in, why softmax fuses','exercise','',0.5,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g4-1','gpu-g4',1,'Optimizing attention for modern hardware (Tri Dao, 2025)','video','https://www.youtube.com/watch?v=cPwt1Y10gjI',0.75,0,'From the FlashAttention author: FlashAttention-2 work partitioning and FlashAttention-3 on Hopper (asynchrony, warp specialization, FP8). Watch mlsys ep. 3 (FlashAttention 1–4) first.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g4-2','gpu-g4',2,'GPU MODE Lecture 41: FlashInfer','video','https://www.youtube.com/watch?v=iOLBJwENuvA',1.25,0,'Attention kernels for LLM serving: paged/ragged KV cache, split-KV decode (the Flash-Decoding idea), load balancing. Decode is memory-bound: your PIM angle.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('gpu-g4-3','gpu-g4',3,'Explain aloud: FlashAttention 1 → 2 → 3 in one sentence each; why batch-1 decode underuses a GPU and how splitting the KV sequence (Flash-Decoding) fixes it','exercise','',0.5,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m1-1','mlir-m1',1,'MLIR Beginner-Friendly Tutorial 2, Parts 1–2 (Alex Singer, 2026)','video','https://www.youtube.com/watch?v=dae1cvzAoIM',1.75,0,'Part 2: https://www.youtube.com/watch?v=erQu0vkZdns . You know this; watch at 1.5x for the vocabulary interviewers use.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m1-2','mlir-m1',2,'2025 EuroLLVM: How to bring your Neural Network into Upstream MLIR Dialects','video','https://www.youtube.com/watch?v=Uzct1s22BSU',0.5,0,'Framework import to tosa/linalg.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m2-1','mlir-m2',1,'2025 EuroLLVM: An Introduction to Tensor Tiling in MLIR','video','https://www.youtube.com/watch?v=FLEb30WyroA',0.75,0,'TilingInterface, tile-and-fuse.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m2-2','mlir-m2',2,'2024 EuroLLVM: Transform-dialect schedules','video','https://www.youtube.com/watch?v=YOWAhrh_qxs',0.25,0,'Schedules as IR: separating what from how.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m2-3','mlir-m2',3,'2023 LLVM Dev Mtg: MLIR Bufferization, From Tensors to MemRefs','video','https://www.youtube.com/watch?v=nLydW5zQoLU',1,0,'One-shot bufferization; the reference talk.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m3-1','mlir-m3',1,'2026 EuroLLVM: rocMLIR, High-Performance ML Compilation for AMD GPUs','video','https://www.youtube.com/watch?v=zFhGS0-F4Tg',0.5,0,'How a vendor stack lowers GEMM and attention.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m3-2','mlir-m3',2,'2026 EuroLLVM: HIVM, MLIR Dialect Stack for Ascend NPU Compilation','video','https://www.youtube.com/watch?v=E0ZsSSy01Q0',0.5,0,'A full NPU dialect stack: the closest analogue to a PIM backend.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m3-3','mlir-m3',3,'2025 US LLVM Dev Mtg: MLIR-based graph compiler for in-memory inference computing','video','https://www.youtube.com/watch?v=vtE_3xit044',0.25,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m4-1','mlir-m4',1,'An introduction to LLVM IR (rev.ng, 2025)','video','https://www.youtube.com/watch?v=CDKuH7SIgdM',0.5,0,'SSA values, basic blocks, phi nodes, types, GEP: the IR every MLIR pipeline ends in.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m4-2','mlir-m4',2,'2023 EuroLLVM Tutorial: A whirlwind tour of the LLVM optimizer (Nikita Popov)','video','https://www.youtube.com/watch?v=7GHXDEIMGIY',0.75,0,'How the middle-end pass pipeline is organized and what the main passes do. Watch at 1.25x.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m4-3','mlir-m4',3,'2024 LLVM Dev Mtg: A Beginners'' Guide to SelectionDAG','video','https://www.youtube.com/watch?v=nNQ6AF6i5FI',0.75,0,'Backend basics: IR to SelectionDAG, legalization, instruction selection with TableGen patterns, then scheduling and machine code. Watch at 1.25x.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m5-1','mlir-m5',1,'[TVM] Universally Deploy Large-language Models via ML Compilation (Tianqi Chen, CMU & OctoAI, PyTorch Conf 2024)','video','https://www.youtube.com/watch?v=n66LLI_ebx0',0.25,0,'From TVM''s creator: TVM is an end-to-end ML compiler (graph IR → TensorIR, auto-tuned schedules, many backends; MLC-LLM). Contrast: TVM is a full compiler with its own IRs; MLIR is infrastructure for building compilers from dialects.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlir-m5-2','mlir-m5',2,'OpenXLA Overview (OpenXLA, 2023)','video','https://www.youtube.com/watch?v=4auG88gtlU8',0.25,0,'XLA = Google''s compiler for JAX/TensorFlow/PyTorch-XLA: StableHLO in (an MLIR dialect), HLO graph passes such as fusion and layout assignment, GPU/TPU/CPU backends via PJRT. Contrast: XLA is a product compiler that uses MLIR at its edges.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l1-1','mlsys-l1',1,'3Blue1Brown: Attention in transformers, step-by-step (DL6)','video','https://www.youtube.com/watch?v=eMlx5fFNoYc',0.5,0,'Clearest picture of Q/K/V. Skip if you can derive it.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l1-2','mlsys-l1',2,'Stanford CS336 (Spring 2026) Lecture 3: Architectures','video','https://www.youtube.com/watch?v=lVynu4bo1rY&list=PLoROMvodv4rMqXOcazWaTUHhq-yembLCV',1.75,0,'RoPE, GQA/MQA, norms, activations, MoE variants. (Embedding disabled by Stanford: opens on YouTube.)');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l1-3','mlsys-l1',3,'Stanford CS336 (Spring 2026) Lecture 4: Attention Alternatives','video','https://www.youtube.com/watch?v=cKSwj_qZ8Jg&list=PLoROMvodv4rMqXOcazWaTUHhq-yembLCV',1.75,0,'Linear attention, SSMs/Mamba, hybrids. (Embedding disabled by Stanford: opens on YouTube.)');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l2-1','mlsys-l2',1,'LLM Inference ep. 1: The Memory Wall','video','https://www.youtube.com/watch?v=ENkuf_2zbkc&list=PLqO45Dg1pMhlDBZTMqVL2GU-14xYip2y2',0.5,0,'Roofline of prefill vs decode on H100.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l2-2','mlsys-l2',2,'LLM Inference ep. 3: Kernels and Memory (FlashAttention 1–4)','video','https://www.youtube.com/watch?v=30IRJQ49M2g&list=PLqO45Dg1pMhlDBZTMqVL2GU-14xYip2y2',1,0,'Tiling and online softmax; why attention is an IO problem.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l2-3','mlsys-l2',3,'LLM Inference ep. 4: Quantization','video','https://www.youtube.com/watch?v=1JWnEze9V5g&list=PLqO45Dg1pMhlDBZTMqVL2GU-14xYip2y2',0.5,0,'INT8/FP8/INT4; weight-only vs activation quantization.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l2-4','mlsys-l2',4,'LLM Inference ep. 5–6: Parallelism; Mixture of Experts','video','https://www.youtube.com/watch?v=Kjq2vCIH3S8&list=PLqO45Dg1pMhlDBZTMqVL2GU-14xYip2y2',0.75,0,'Plays in order in the playlist.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l2-5','mlsys-l2',5,'LLM Inference ep. 7–8: Serving in Production; Speculative Decoding and Long Context','video','https://www.youtube.com/watch?v=9gmHwe5-j0E&list=PLqO45Dg1pMhlDBZTMqVL2GU-14xYip2y2',1.25,0,'Continuous batching, PagedAttention/vLLM, prefill/decode disaggregation. Plays in order in the playlist.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l3-1','mlsys-l3',1,'ONNX in one line: ONNX Explained with Example','concept','https://www.youtube.com/watch?v=cZtXdMao7Ic',0.25,0,'One line: a framework-neutral graph + operator-set format that runtimes and compilers import.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l3-2','mlsys-l3',2,'LLVM in one line: LLVM in 100 Seconds (Fireship)','concept','https://www.youtube.com/watch?v=BT2Cv-Tjq7Q',0.25,0,'One line: SSA IR + optimizer + backends; MLIR lowers to it.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('mlsys-l3-3','mlsys-l3',3,'Compute KV-cache bytes and decode arithmetic intensity for a 70B GQA model at batch 1 vs 64 on H100; explain what PIM changes','exercise','',0.75,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-o3-3','os-extra',1,'OS L29 and L31: Locking in xv6; Device Driver and Block I/O in xv6 (Vutukuru)','video','https://www.youtube.com/watch?v=icLsJLGbLuA&list=PLDW872573QAb4bj0URobvQTD41IV6gRkx',0.5,0,'Spinlocks with xchg and interrupt disabling; a real driver''s MMIO/interrupt path (pairs with soc-s2-2). L31: https://www.youtube.com/watch?v=YGiuurOWkgA&list=PLDW872573QAb4bj0URobvQTD41IV6gRkx');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-o4-1','os-extra',2,'How Do Linux Kernel Drivers Work? (LiveOverflow)','video','https://www.youtube.com/watch?v=juGNPLdjLH4',0.5,0,'Kernel modules, character devices, file_operations (open/read/write/ioctl), how a user-space call reaches driver code. The Linux version of the xv6 driver lecture (os-o3-3).');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-o4-2','os-extra',3,'Using DMA in a Linux PCI or PCI Express Driver (Johannes 4GNU_Linux, 2023)','video','https://www.youtube.com/watch?v=BDYbR1S9oHE',0.5,0,'Driver view of a PCIe device: BARs/MMIO, allocating a DMA buffer, programming the device''s DMA engine, completion. Watch 0:00–3:30 (PCI transaction theory) and 13:07–20:33 (the driver) if short on time.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-Ff07-u9cQaI','os-u1',1,'1. Why Operating Systems?','video','https://www.youtube.com/watch?v=Ff07-u9cQaI&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.86,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-I9ySNos57eU','os-u1',2,'2. Kernels','video','https://www.youtube.com/watch?v=I9ySNos57eU&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.9,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-3yCZuVgAfK0','os-u1',3,'3. Libraries','video','https://www.youtube.com/watch?v=3yCZuVgAfK0&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.85,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-iqgAKamVUvg','os-u2',1,'4. Process Creation','video','https://www.youtube.com/watch?v=iqgAKamVUvg&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.87,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-FkxtU4Uc6ow','os-u2',2,'5. Process Management','video','https://www.youtube.com/watch?v=FkxtU4Uc6ow&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.86,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-am6xVuvC18k','os-u2',3,'7. Process Practice','video','https://www.youtube.com/watch?v=am6xVuvC18k&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.96,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-pkSscCXyfB4','os-u2',4,'8. Subprocess','video','https://www.youtube.com/watch?v=pkSscCXyfB4&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.92,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-xzq-BXwz4Bk','os-u3',1,'9. Basic Scheduling','video','https://www.youtube.com/watch?v=xzq-BXwz4Bk&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.78,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-KdZ0mMG_d9I','os-u3',2,'10. Advanced Scheduling','video','https://www.youtube.com/watch?v=KdZ0mMG_d9I&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.81,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-yHX9ex7vY08','os-u3',3,'15. Priority Scheduling and Memory Mapping','video','https://www.youtube.com/watch?v=yHX9ex7vY08&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.72,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-8PyzzB0OOBk','os-u4',1,'11. Virtual Memory','video','https://www.youtube.com/watch?v=8PyzzB0OOBk&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.89,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-_pBvuiLPkNM','os-u4',2,'12. Page Tables','video','https://www.youtube.com/watch?v=_pBvuiLPkNM&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.87,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-aWSauzBO8uo','os-u4',3,'13. Page Table Implementation','video','https://www.youtube.com/watch?v=aWSauzBO8uo&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.93,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-95zhfuptcG0','os-u4',4,'14. Virtual Memory Lab Primer','video','https://www.youtube.com/watch?v=95zhfuptcG0&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.9,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-3rN-IaeyqEo','os-u5',1,'16. Threads','video','https://www.youtube.com/watch?v=3rN-IaeyqEo&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.86,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-tI9o_kVkGYk','os-u5',2,'20. User Threads Lab Primer','video','https://www.youtube.com/watch?v=tI9o_kVkGYk&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.75,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-uFAq0-WSq6Q','os-u5',3,'21. Locks','video','https://www.youtube.com/watch?v=uFAq0-WSq6Q&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.64,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-tM7SJtO7gHw','os-u5',4,'22. Locks Implementation','video','https://www.youtube.com/watch?v=tM7SJtO7gHw&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.71,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-i5rl1ev1EJs','os-u5',5,'23. Semaphores','video','https://www.youtube.com/watch?v=i5rl1ev1EJs&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.85,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-N2T24p34Rxc','os-u5',6,'24. Locking','video','https://www.youtube.com/watch?v=N2T24p34Rxc&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.84,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-6t5ZGoQcV0k','os-u5',7,'25. Parallelization Example','video','https://www.youtube.com/watch?v=6t5ZGoQcV0k&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.6,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-PxETSrcTGBk','os-u6',1,'18. Sockets','video','https://www.youtube.com/watch?v=PxETSrcTGBk&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.52,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-Zd0o5wI9NPw','os-u7',1,'26. Disks','video','https://www.youtube.com/watch?v=Zd0o5wI9NPw&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.78,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-9lCQtrHovP0','os-u7',2,'27. Filesystems','video','https://www.youtube.com/watch?v=9lCQtrHovP0&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.77,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-AhHeNFjrkn8','os-u7',3,'28. inodes','video','https://www.youtube.com/watch?v=AhHeNFjrkn8&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.79,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-Deik4eDPrDU','os-u8',1,'29. Page Replacement','video','https://www.youtube.com/watch?v=Deik4eDPrDU&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.61,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-dfBUbo-f05k','os-u8',2,'30. Clock Page Replacement','video','https://www.youtube.com/watch?v=dfBUbo-f05k&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.45,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-ldbNQkbPF1Y','os-u8',3,'31. Memory Allocation','video','https://www.youtube.com/watch?v=ldbNQkbPF1Y&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.47,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-T5o17Lepce4','os-u8',4,'32. Buddy and Slab Allocators','video','https://www.youtube.com/watch?v=T5o17Lepce4&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.36,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-3X4hhcsd3_I','os-u9',1,'19. Midterm Review','video','https://www.youtube.com/watch?v=3X4hhcsd3_I&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.91,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-fhQl4Ac3ox8','os-u9',2,'33. Virtual Machines','video','https://www.youtube.com/watch?v=fhQl4Ac3ox8&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.63,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-WPMsr4_gxk8','os-u9',3,'34. Course Recap','video','https://www.youtube.com/watch?v=WPMsr4_gxk8&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.74,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-v-S7Q3hfJ1Pgw','os-u9',4,'35. Final Review','video','https://www.youtube.com/watch?v=S7Q3hfJ1Pgw&list=PLunILarQwxnntWWNJ64E7wC4KhsEwHWxB',0.92,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m1-1','rtl-m1',1,'Cummings: Nonblocking Assignments in Verilog Synthesis, Coding Styles That Kill! (SNUG 2000)','concept','https://web.archive.org/web/20240114192525/http://www.sunburst-design.com/papers/CummingsSNUG2000SJ_NBA.pdf',0.75,0,'Read the 8 coding guidelines and the race examples (shift register, LFSR). Interview answer in one line: nonblocking (<=) in always_ff, blocking (=) in always_comb, never mix them in one block. Archived copy (sunburst-design.com now redirects to a login page).');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m1-2','rtl-m1',2,'Cummings: FSM design and synthesis using SystemVerilog, part 1 (SNUG 2019)','concept','https://web.archive.org/web/20240201013617/http://www.sunburst-design.com/papers/CummingsSNUG2019SV_FSM1.pdf',0.75,1,'Coding styles compared: 1-, 2- and 3-always FSMs, registered outputs, enum state types, one-hot vs binary encoding. Skim for the recommended style and the encoding trade-offs. Archived copy.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m1-3','rtl-m1',3,'Drill: from a blank file in 15 min each: 1011 overlapping detector (Moore and Mealy), divide-by-3 clock with 50% duty, rising-edge detector, sync vs async reset flop; then list 4 ways to infer a latch by accident','exercise','',0.75,0,'Do them in EDA Playground (the HDL roadmap has matching problems). Say each design out loud as you would at a whiteboard.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m2-1','rtl-m2',1,'ZipCPU: AXI Handshaking Rules','concept','https://zipcpu.com/blog/2021/08/28/axi-rules.html',0.5,0,'The valid/ready contract every interview assumes: transfer on VALID && READY, VALID may not wait for READY, payload stable while VALID && !READY. The skid buffer and pipeline problems in the HDL roadmap build on it.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m2-2','rtl-m2',2,'Calculating FIFO Depth (asic-world)','concept','https://www.asic-world.com/tidbits/fifo_depth.html',0.25,0,'Worked burst examples: depth = burst minus the words drained during the burst; add synchronizer latency for async FIFOs. Interviewers ask this with numbers.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m2-3','rtl-m2',3,'Drill: sync FIFO (extra pointer bit for full/empty), round-robin arbiter (masked priority), skid buffer; size a FIFO for 3 burst scenarios','exercise','',1,0,'Write from memory, then compare with the HDL roadmap problems. Be ready to name the critical path of each and how to register the outputs.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m3-1','rtl-m3',1,'Cummings: Clock Domain Crossing (CDC) Design & Verification Techniques Using SystemVerilog (SNUG 2008)','concept','https://web.archive.org/web/20240110182410/http://www.sunburst-design.com/papers/CummingsSNUG2008Boston_CDC.pdf',1.5,0,'The reference for all 3 methods: 2-flop synchronizer and MTBF, pulse/toggle and req/ack (MCP) handshakes for multi-bit data, FIFOs; plus reconvergence and why you never synchronize a binary bus bit by bit. Archived copy.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m3-2','rtl-m3',2,'Cummings: Simulation and Synthesis Techniques for Asynchronous FIFO Design (SNUG 2002, FIFO1)','concept','https://web.archive.org/web/20240304004420/http://www.sunburst-design.com/papers/CummingsSNUG2002SJ_FIFO1.pdf',1,0,'Gray pointers with one extra bit; empty when the synchronized write pointer equals the read pointer; full when the top two bits differ and the rest match. Pessimistic but safe flags. Archived copy.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m3-3','rtl-m3',3,'ZipCPU: Some Simple Clock-Domain Crossing Solutions','concept','https://zipcpu.com/blog/2017/10/20/cdc.html',0.5,1,'Short and code-first: 2-flop sync, pulse crossing and a handshake, with waveforms. A good last look before an interview.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m3-4','rtl-m3',4,'Cummings, Mills, Golson: Asynchronous & Synchronous Reset Design Techniques, Part Deux (SNUG 2003): the reset synchronizer sections','concept','https://web.archive.org/web/20240621013721/http://www.sunburst-design.com/papers/CummingsSNUG2003Boston_Resets.pdf',0.5,1,'Async assert, sync deassert; reset distribution; recovery/removal checks. Read the synchronizer and glitch-filter sections only. Archived copy.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m3-5','rtl-m3',5,'Drill: MTBF for a 1- vs 2-flop synchronizer from tau, T0, f_clk, f_data; choose the CDC method for 5 scenarios (level, pulse fast-to-slow, 32-bit config register, streaming data, reset)','exercise','',0.5,0,'MTBF = e^(t_r/tau) / (T0 * f_clk * f_data). Each extra flop adds about one clock period of resolution time, multiplying MTBF by about e^(T_clk/tau).');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m4-1','rtl-m4',1,'FPGA Timing Optimization: Background and Challenges','video','https://www.youtube.com/watch?v=9Ld9Sr_JE9o&list=PLx-Ml26M7ApIfR5VF0B7LKx0NYqMJ7GR4',0.4,0,'Series intro (Greg Stitt, UF). Listen for the timing model: clock-to-Q + logic + routing + setup sets the clock period, which register-to-register path is critical, and why routing delay makes FPGA timing hard.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m4-2','rtl-m4',2,'FPGA Timing Optimization: Optimization Strategies','video','https://www.youtube.com/watch?v=EZtRwBts9i8&list=PLx-Ml26M7ApIfR5VF0B7LKx0NYqMJ7GR4',0.75,0,'The RTL side of timing closure (pipelining, retiming, duplicating high-fanout registers, restructuring logic): the answers to "this path fails setup, what do you change in the RTL?"');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m4-3','rtl-m4',3,'FPGA Timing Optimization: Quartus Timing Analyzer','video','https://www.youtube.com/watch?v=_rEisLZZIjI&list=PLx-Ml26M7ApIfR5VF0B7LKx0NYqMJ7GR4',0.5,0,'Reading a timing report: clock constraints, slack, setup vs hold checks on the worst paths. Map it to Vivado report_timing_summary, which you use.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m4-4','rtl-m4',4,'FPGA Timing Optimization: Timer Example OLD','video','https://www.youtube.com/watch?v=sqXiR0RHgTA&list=PLx-Ml26M7ApIfR5VF0B7LKx0NYqMJ7GR4',0.25,1,'Earlier upload of the timer example (same length as the next video). Skip unless the newer one is unclear.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m4-5','rtl-m4',5,'FPGA Timing Optimization: Timer Example','video','https://www.youtube.com/watch?v=CxkkZFIKGU4&list=PLx-Ml26M7ApIfR5VF0B7LKx0NYqMJ7GR4',0.25,0,'A worked example on a small timer design.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m4-6','rtl-m4',6,'Drill: 6 timing problems on paper: setup and hold slack with positive and negative skew, fmax of a path, fmax after splitting the logic into 2 stages, a hold violation and its fix, a multicycle path','exercise','',0.5,0,'Setup: T >= t_cq + t_logic,max + t_su - skew + t_unc. Hold: t_cq + t_logic,min >= t_hold + skew. The ASIC view (equations with skew, a worked STA example) is in VLSI basics, vlsi-v2.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m5-1','rtl-m5',1,'ChipVerify: SystemVerilog Assertions','concept','https://www.chipverify.com/systemverilog/systemverilog-assertions',0.5,0,'Immediate vs concurrent assertions, |-> vs |=>, ##n delays, $stable/$rose/$past, disable iff. Enough to write handshake and FIFO properties.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m5-2','rtl-m5',2,'ChipVerify: SystemVerilog Functional Coverage','concept','https://www.chipverify.com/systemverilog/systemverilog-functional-coverage',0.25,0,'covergroup, coverpoint, bins, cross; code vs functional coverage.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m5-3','rtl-m5',3,'ChipVerify: UVM Tutorial (testbench top, components, phases, factory, config_db)','concept','https://www.chipverify.com/uvm/uvm-tutorial',1,0,'Read the testbench structure and phases pages, then the UVM testbench example. Enough to draw a UVM environment and say what each component does.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('rtl-m5-4','rtl-m5',4,'Drill: self-checking FIFO testbench with a queue model, 3 SVA properties (no push when full, no pop when empty, data stable while valid && !ready), a covergroup with a cross','exercise','',0.75,0,'EDA Playground. Matches the verification problems in the HDL roadmap.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s1-4','soc-extra',1,'Arm AMBA training: AXI and CHI basics (first 11 short clips)','video','https://www.youtube.com/watch?v=CZlDTQzOfq4&list=PLgyFKd2HIZlYM-w4_veHgX0trB-epVXum',0.5,0,'Official Arm clips of 1–4 minutes: the AMBA family (APB/AHB/AXI/CHI), AXI''s five channels and handshake, multi-manager systems, CHI node types and channels. Stop after "CHI Node channels". Gives the exact protocol words SoC interviewers use.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s1-5','soc-extra',2,'EE5332 L12.5: NoC Concepts (Nitin Chandrachoodan, IIT Madras)','video','https://www.youtube.com/watch?v=A_zk8BJkHlQ',0.5,1,'Why buses stop scaling and what a network-on-chip adds: packets/flits, routers, topology, routing, flow control. Short SoC-level version; arch L23 (Interconnects) is the deep dive, so skip this if you watched that.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s2-2','soc-extra',3,'How CPUs Interact with So Many Different Devices (Core Dumped)','video','https://www.youtube.com/watch?v=tadUeiNe5-g',0.5,0,'MMIO, interrupts, DMA, drivers: the HW/SW interface in one video.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s2-3','soc-extra',4,'PCIe Protocol Introduction: Architecture, Lanes, Packets (Code2Chip, 2026)','video','https://www.youtube.com/watch?v=9cg66fgC9UM',0.25,0,'Root complex/switch/endpoint, lanes and link width, transaction/data-link/physical layers, TLPs (memory read/write, completions), Gen5/Gen6. How a host talks to an accelerator card and how its DMA engines reach host memory.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s2-4','soc-extra',5,'The Power of CXL (TechTechPotato, 2025)','video','https://www.youtube.com/watch?v=zQGZFBrGmK4',0.5,0,'CXL runs on the PCIe physical layer and adds CXL.io / CXL.cache / CXL.mem: coherent device caches, memory expansion and pooling. Connects to the memory-wall and CXL line in pitch-b4-2.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s3-1','soc-extra',6,'DVD L6b: Multiple Voltage Domains (Adi Teman)','video','https://www.youtube.com/watch?v=5R4eEOT9rRk&list=PLZU5hLL_713x0_AV_rVbay0pWmED7992G',0.25,0,'Level shifters, isolation, always-on domains.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s3-2','soc-extra',7,'Low Power VLSI Design: clock gating, power gating, multi-voltage (Dr. Shobha Nikam)','video','https://www.youtube.com/watch?v=aZEBt1a-yUE',0.25,0,'Add DVFS to your answer.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-fw-1','soc-fw',1,'cpq: Bare-metal programming guide (ARM microcontroller, no libraries)','concept','https://github.com/cpq/bare-metal-programming-guide',1,0,'Peripheral registers as memory addresses (volatile struct overlays), vector table and reset handler, linker script, startup code, SysTick interrupt, UART. Read up to and including the interrupt section.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-fw-2','soc-fw',2,'Memfault Interrupt: From Zero to main(): Bare metal C','concept','https://interrupt.memfault.com/blog/zero-to-main-1',0.5,1,'What runs before main: reset vector, copying .data from flash, zeroing .bss, stack setup. The firmware side of soc-l8 "The Boot Sequence".');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-fw-3','soc-fw',3,'Memfault Interrupt: A Practical guide to ARM Cortex-M Exception Handling','concept','https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic',0.75,0,'An interrupt controller in practice: priorities and preemption, pending/active bits, vector table, what the hardware stacks on entry, tail-chaining. Deeper than the soc-l7 interrupt lecture.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-fw-4','soc-fw',4,'Gerstlauer (UT Austin EE382M SoC design), Lecture 6: HW/SW interfacing for accelerators (slides)','concept','https://users.ece.utexas.edu/~gerstl/ee382m_f18/lectures/lecture_6.pdf',0.5,0,'The accelerator as a bus device: control/status registers, shared memory and DMA for bulk data, polling vs interrupts, and the cache-coherence trap (flush/invalidate shared buffers). The co-design view of your own PIM/ECC hardware.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-fw-5','soc-fw',5,'Gemmini (Berkeley): README, software section','concept','https://github.com/ucb-bar/gemmini',0.5,1,'A real ML accelerator''s HW/SW split: custom RoCC instructions (config, mvin/mvout, compute), a C header library, and tiling in software around fixed-function hardware.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-fw-6','soc-fw',6,'Drill: design the CSR map and driver for an accelerator (CTRL, STATUS, IRQ_EN/IRQ_STATUS write-1-to-clear, DMA src/dst/len): start, poll vs interrupt, cache flush/invalidate around DMA; say what you would keep in software and why','exercise','',0.5,0,'Write the C with volatile pointers and the RTL register block side by side. Use your own accelerator (PIM or ECC decode) as the example.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-_E2PS9jxkrA','soc-l1',1,'Introduction and Motivation','video','https://www.youtube.com/watch?v=_E2PS9jxkrA&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.05,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s1-1','soc-l1',2,'MPU, MCU, and SoC','video','https://www.youtube.com/watch?v=Fs76s10vaus&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.22,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s1-3','soc-l1',3,'What is an Embedded System?','video','https://www.youtube.com/watch?v=4ZLFl9os45I&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.27,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-aQFh1bBjWWM','soc-l1',4,'Components of Embedded Systems','video','https://www.youtube.com/watch?v=aQFh1bBjWWM&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.19,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s4-1','soc-l2',1,'The Microprocessor','video','https://www.youtube.com/watch?v=Ztju3z84K5I&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.46,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-OsPY_gbwUDQ','soc-l2',2,'The Instruction Set Architecture (ISA)','video','https://www.youtube.com/watch?v=OsPY_gbwUDQ&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.35,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-gHJsJsIoBW8','soc-l2',3,'Calling a Procedure','video','https://www.youtube.com/watch?v=gHJsJsIoBW8&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.12,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-4GpwBCiPa4s','soc-l2',4,'Running a Program (CALL)','video','https://www.youtube.com/watch?v=4GpwBCiPa4s&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.15,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-TjRKAUBYIPM','soc-l2',5,'Measuring Performance','video','https://www.youtube.com/watch?v=TjRKAUBYIPM&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.23,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s4-2','soc-l3',1,'From C to Assembly','video','https://www.youtube.com/watch?v=ipf79bGUHd8&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.19,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-VCDjsR23srU','soc-l3',2,'Basic CPU Operations','video','https://www.youtube.com/watch?v=VCDjsR23srU&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.29,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-pcBPcaxIpF8','soc-l3',3,'Variables and Memory Access','video','https://www.youtube.com/watch?v=pcBPcaxIpF8&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.43,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-UWLCkNDfs38','soc-l3',4,'Control Flow','video','https://www.youtube.com/watch?v=UWLCkNDfs38&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.15,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-ligsoJnZUG8','soc-l3',5,'Procedure Calls','video','https://www.youtube.com/watch?v=ligsoJnZUG8&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.34,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s4-3','soc-l3',6,'RISC-V Features and Extensions','video','https://www.youtube.com/watch?v=9jjJWkXYH1I&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.5,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-0puUqvmROB0','soc-l3',7,'The Build Process (CALL)','video','https://www.youtube.com/watch?v=0puUqvmROB0&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.33,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s1-2','soc-l4',1,'On-Chip Interconnect','video','https://www.youtube.com/watch?v=fNs4I78YLng&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.14,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-24MRbfxmyvw','soc-l4',2,'Connecting with Peripherals','video','https://www.youtube.com/watch?v=24MRbfxmyvw&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.32,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-EZrl33ZeOKI','soc-l4',3,'Simple Bus Operation','video','https://www.youtube.com/watch?v=EZrl33ZeOKI&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.25,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-Njvk_YuqIiE','soc-l4',4,'Higher Performance Buses','video','https://www.youtube.com/watch?v=Njvk_YuqIiE&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.36,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s2-1','soc-l5',1,'Communicating with Peripherals (or "How to build a router")','video','https://www.youtube.com/watch?v=dKc0DwbAXjI&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.27,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-GHFrt55Q7Ls','soc-l5',2,'Offloading the CPU','video','https://www.youtube.com/watch?v=GHFrt55Q7Ls&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.16,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-8c-YmCHkG0Y','soc-l5',3,'Dealing with Faster Interfaces','video','https://www.youtube.com/watch?v=8c-YmCHkG0Y&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.17,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-ltM8HL_DSnI','soc-l5',4,'More Offloading','video','https://www.youtube.com/watch?v=ltM8HL_DSnI&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.21,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-CBTmPL7CPb0','soc-l5',5,'Memory','video','https://www.youtube.com/watch?v=CBTmPL7CPb0&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.19,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-8n-O6Z8LIVk','soc-l5',6,'Finishing our Design','video','https://www.youtube.com/watch?v=8n-O6Z8LIVk&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.16,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-prUi92IAcYk','soc-l6',1,'The Memory Hierarchy','video','https://www.youtube.com/watch?v=prUi92IAcYk&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.25,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-XxWOLlCLxYU','soc-l6',2,'Cache Organization','video','https://www.youtube.com/watch?v=XxWOLlCLxYU&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.35,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-VJNimZEIvhw','soc-l6',3,'Tradeoffs in Cache Design','video','https://www.youtube.com/watch?v=VJNimZEIvhw&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.41,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-O6jWTqIcTwA','soc-l6',4,'Virtual Memory','video','https://www.youtube.com/watch?v=O6jWTqIcTwA&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.4,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-YSVNZIO885g','soc-l6',5,'Practical Paging','video','https://www.youtube.com/watch?v=YSVNZIO885g&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.19,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-o1-1','soc-l6',6,'The Translation Lookaside Buffer (TLB)','video','https://www.youtube.com/watch?v=keuMzKPMKg8&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.34,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-o1-2','soc-l7',1,'Operating Systems','video','https://www.youtube.com/watch?v=StIIdWi9ce0&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.31,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v--_53ReXJDWI','soc-l7',2,'The Kernel','video','https://www.youtube.com/watch?v=-_53ReXJDWI&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.19,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-hP_s07YZK8s','soc-l7',3,'Interrupt Handling','video','https://www.youtube.com/watch?v=hP_s07YZK8s&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.24,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-o2-1','soc-l7',4,'Scheduling (Processes and Threads)','video','https://www.youtube.com/watch?v=44k_CdIougs&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.35,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('os-o2-2','soc-l7',5,'Synchronization and Protection','video','https://www.youtube.com/watch?v=r5pEHkfNGco&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.59,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-J656zMtJ6e4','soc-l7',6,'Real-Time Operating Systems (RTOS)','video','https://www.youtube.com/watch?v=J656zMtJ6e4&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.28,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-s5-1','soc-l8',1,'Ramp Up and Debug (Post-Silicon)','video','https://www.youtube.com/watch?v=GwlwBrEQnCI&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.08,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-GAQy1yfh5Uo','soc-l8',2,'The Boot Sequence','video','https://www.youtube.com/watch?v=GAQy1yfh5Uo&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.23,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-UjeG9GUFIzw','soc-l8',3,'Bonding Debug','video','https://www.youtube.com/watch?v=UjeG9GUFIzw&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.12,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-aM4Iley-6Wc','soc-l8',4,'Overcoming Hold Violations','video','https://www.youtube.com/watch?v=aM4Iley-6Wc&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.19,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('soc-v-2X4RYBfm-KE','soc-l8',5,'Circuit Editing FIB','video','https://www.youtube.com/watch?v=2X4RYBfm-KE&list=PLZU5hLL_713ygweO3b_9KiZUJuEI7I5yK',0.16,0,'');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('vlsi-v0-1','vlsi-v0',1,'DIC L1c: How a Chip is Born','video','https://www.youtube.com/watch?v=cjKi2tpvszE&list=PLZU5hLL_713yF0Lkwjj9O3ttVIuhPV-me',0.25,0,'The design flow at a glance, from spec and RTL through synthesis, place & route and signoff to tape-out. Keep this picture; every later lecture slots into it.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('vlsi-v0-2','vlsi-v0',2,'Physical Design Flow Explained: Netlist to GDSII in 7 minutes (Bharat IC, 2026)','video','https://www.youtube.com/watch?v=iu0KwaLFMV4',0.25,0,'Expands the back half of L1c: inputs (netlist, LEF/Liberty, SDC), floorplan, power plan, placement, CTS (skew, hold fixing), routing, signoff (STA, DRC/LVS, IR/EM). Ignore the course ad at the end.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('vlsi-v1-1','vlsi-v1',1,'DIC L3a–b: MOSFET Modeling','video','https://www.youtube.com/watch?v=KnKEFbpTNrU&list=PLZU5hLL_713yF0Lkwjj9O3ttVIuhPV-me',0.5,0,'From the switch model to velocity saturation and threshold voltage. Enough to say why delay grows with C·V/I.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('vlsi-v1-4','vlsi-v1',2,'DIC L4: Design Metrics','video','https://www.youtube.com/watch?v=_sT7hXS0gnA&list=PLZU5hLL_713yF0Lkwjj9O3ttVIuhPV-me',0.75,0,'Design abstraction and the metrics used for every gate: noise margins, propagation delay, dynamic (αCV²f), short-circuit and leakage power, energy-delay.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('vlsi-v2-1','vlsi-v2',1,'DIC L7a–7c: Sequential Logic Motivation, Sequential Logic Elements, Timing Parameters','video','https://www.youtube.com/watch?v=tXnFuKpZ6P0&list=PLZU5hLL_713yF0Lkwjj9O3ttVIuhPV-me',1,0,'Latches vs flip-flops; t_setup, t_hold, t_clk-q. Plays in order in the playlist.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('vlsi-v2-2','vlsi-v2',2,'DIC L7e–7f: Basic Timing Constraints, STA Example','video','https://www.youtube.com/watch?v=gEwNvszSh3c&list=PLZU5hLL_713yF0Lkwjj9O3ttVIuhPV-me',0.75,0,'Setup and hold equations with clock skew, then a worked STA example (arrival, required, slack). This is how signoff STA thinks.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('vlsi-v2-3','vlsi-v2',3,'Post-STA Optimization: Physical ECOs for Timing Closure (STA Made Simple, 2026)','video','https://www.youtube.com/watch?v=5Tx-C2eOOxw',0.25,0,'Timing closure after CTS/route: fixing setup with buffering, cell resizing (Vt/drive swaps) and route fixes, hold with delay buffers, useful skew; why logic changes are avoided late. Builds on the L7e–7f setup/hold equations.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('vlsi-v4-1','vlsi-v4',1,'DIC L8a–8c: SRAM Introduction, 6T Bitcell, 6T Operation','video','https://www.youtube.com/watch?v=Ji2Tu7Oktaw&list=PLZU5hLL_713yF0Lkwjj9O3ttVIuhPV-me',1.25,0,'Read/write sizing constraints.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('vlsi-v4-2','vlsi-v4',2,'DIC L8e: SRAM Stability','video','https://www.youtube.com/watch?v=wpnyjgtNxzg&list=PLZU5hLL_713yF0Lkwjj9O3ttVIuhPV-me',0.25,0,'SNM and read disturb: why CIM perturbs bitlines.');
INSERT OR IGNORE INTO prep_items(id,module_id,position,title,kind,url,est,optional,note) VALUES('vlsi-v4-5','vlsi-v4',3,'Drill: setup/hold slack with skew (3 problems); inverter delay and power from C, V and f; 6T SRAM read vs write sizing; recite the standard-cell flow in order','exercise','',0.5,0,'Paper only, then check against the lectures. Also be ready to draw a static CMOS NAND and NOR (pull-down: NMOS in series/parallel; pull-up: the PMOS dual).');
INSERT OR IGNORE INTO prep_focus(id,name,description,position,preset,created_at,updated_at) VALUES(1,'Internships','An internship-season order: memory systems, core architecture (pipelining, out-of-order, branch prediction, caches, prefetching, virtual memory, GPUs) with the digital-design fundamentals, ML accelerators plus attention and the KV cache, then RTL (FIFOs, FSMs, CDC, STA).',1,'internships','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO prep_focus(id,name,description,position,preset,created_at,updated_at) VALUES(2,'Role: Architecture & AI accelerators','Computer architecture & microarchitecture, AI/ML accelerators & custom ASICs, and memory systems (SRAM / DRAM / HBM, caches, CXL).',2,'arch-accel','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO prep_focus(id,name,description,position,preset,created_at,updated_at) VALUES(3,'Role: RTL design & embedded firmware','Digital logic & RTL design (FSMs, FIFOs, CDC, STA, verification), embedded firmware & HW/SW co-design (SoC, buses, drivers, DMA, OS), with the memory-system basics both share.',3,'rtl-embedded','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-M2rdcGH53k4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-EbvYrjx26QI');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-F0bK_Wu71i4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-CrAzN0ymgPU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-VBCA0i0lNk4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-pBqAzwltquY');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-smY30P4inhk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-7FZ-A4wMXlk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-kwrlfoUC2IM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-fOl5MLoUzco');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-n4wUE6H8tCU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-r9uLvLZzQyc');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-tp70062TXG8');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-Tqc3XRJB9js');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-ZALI3HY3Zrs');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-05SHU6vh1N4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-x64SoeZ5O4M');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-FbUu2oNcBz4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-TH386wzOXvA');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-DD1y1w-Ar8Q');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a1-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-nx4E34TV8S4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-cSlzoF4VASs');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a1-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-2UgcdfsY7ks');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-BsMxHdxgoos');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-3tt1Hsnm6-c');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a3-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-f3Rq2tGbuUg');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-CSsp9gZQrUE');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'gpu-g1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-m3RYYOH_xWU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-YFJMhObZaGk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-AxpMENs9VEM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a2-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-UFs7Av3hANk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a2-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-pPQjdD6br4I');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-p-7e1af8yUW10');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-VWj2Krqxrnw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-GhcInKOsDqk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-XUZHVrlmCCU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-I5nm_h-GaWQ');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-EHt3M3s2y40');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-SxHLh0UD5xE');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-q-rBRYTKPwc');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-PL9i3PgYpnw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-N82rlxiRfYM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-a4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-7KMJU3TJ44o');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-KKGRhwfcq48');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-D89ae39HwOY');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-3QxunKWbNiI');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-gaGmNeD5pns');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-lJ5UpGvdm4Y');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-ZmlBbyTEm9U');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'arch-x-vN8xRnjT8wA');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m1-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m3-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m3-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m3-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m3-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m3-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m4-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m4-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m4-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m4-6');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m5-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m5-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m5-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m5-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'gpu-g4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'gpu-g4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'gpu-g4-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'mlsys-l1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'mlsys-l1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'mlsys-l1-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'mlsys-l2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'mlsys-l2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'mlsys-l2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'mlsys-l2-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'mlsys-l2-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'accel-x1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'accel-x1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'accel-x1-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'accel-x2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'accel-x2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'accel-x2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-M2rdcGH53k4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-EbvYrjx26QI');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-F0bK_Wu71i4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-CrAzN0ymgPU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-VBCA0i0lNk4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-pBqAzwltquY');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-smY30P4inhk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-7FZ-A4wMXlk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-kwrlfoUC2IM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-fOl5MLoUzco');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-n4wUE6H8tCU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-r9uLvLZzQyc');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-tp70062TXG8');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-Tqc3XRJB9js');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-ZALI3HY3Zrs');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-05SHU6vh1N4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-x64SoeZ5O4M');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-FbUu2oNcBz4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-TH386wzOXvA');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-DD1y1w-Ar8Q');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a1-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-nx4E34TV8S4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-cSlzoF4VASs');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a1-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-2UgcdfsY7ks');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-BsMxHdxgoos');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-3tt1Hsnm6-c');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a3-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-f3Rq2tGbuUg');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-CSsp9gZQrUE');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-m3RYYOH_xWU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-YFJMhObZaGk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-AxpMENs9VEM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a2-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-UFs7Av3hANk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a2-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-pPQjdD6br4I');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-7e1af8yUW10');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-5ybhEMPUFok');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-U1dhvcZ-f_M');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-F2rc28K_xY4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-5b--mxHnDc0');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-2ste61kbVec');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-3kdrI4ZcP84');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-p-v1XcXXKbxsA');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-VWj2Krqxrnw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-GhcInKOsDqk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-XUZHVrlmCCU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-I5nm_h-GaWQ');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-EHt3M3s2y40');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-SxHLh0UD5xE');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-q-rBRYTKPwc');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-PL9i3PgYpnw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-N82rlxiRfYM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-7KMJU3TJ44o');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-KKGRhwfcq48');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-D89ae39HwOY');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-3QxunKWbNiI');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-gaGmNeD5pns');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-lJ5UpGvdm4Y');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-ZmlBbyTEm9U');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-vN8xRnjT8wA');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a3-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-a3-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-Kduwu_soNuU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-9SJ2hQWU9A0');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-_iltf2OC_K0');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'arch-x-tyYOsCpbK0E');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlir-m2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlir-m2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlir-m2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlir-m3-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlir-m3-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlir-m3-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-v-prUi92IAcYk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-v-XxWOLlCLxYU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-v-VJNimZEIvhw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-v-O6jWTqIcTwA');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-v-YSVNZIO885g');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'os-o1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-s1-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-s1-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-s2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-s2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-s2-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-s3-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'soc-s3-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'vlsi-v4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'vlsi-v4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'vlsi-v4-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'rtl-m4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'rtl-m4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'rtl-m4-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'rtl-m4-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'rtl-m4-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'rtl-m4-6');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g3-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g3-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g3-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g3-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g3-6');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g3-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'gpu-g4-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l1-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l2-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l2-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l3-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l3-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'mlsys-l3-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'accel-x1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'accel-x1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'accel-x1-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'accel-x2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'accel-x2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(2,'accel-x2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-M2rdcGH53k4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-EbvYrjx26QI');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-F0bK_Wu71i4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-CrAzN0ymgPU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-VBCA0i0lNk4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-pBqAzwltquY');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-smY30P4inhk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-7FZ-A4wMXlk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-kwrlfoUC2IM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-fOl5MLoUzco');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-n4wUE6H8tCU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-r9uLvLZzQyc');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-tp70062TXG8');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-Tqc3XRJB9js');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-ZALI3HY3Zrs');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-05SHU6vh1N4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-x64SoeZ5O4M');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-a1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-FbUu2oNcBz4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-TH386wzOXvA');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-DD1y1w-Ar8Q');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'gpu-g1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-a2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-m3RYYOH_xWU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-YFJMhObZaGk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-a2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-AxpMENs9VEM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-a2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-a2-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-UFs7Av3hANk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-a2-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-pPQjdD6br4I');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'arch-p-7e1af8yUW10');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-_E2PS9jxkrA');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s1-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-aQFh1bBjWWM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-OsPY_gbwUDQ');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-gHJsJsIoBW8');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-4GpwBCiPa4s');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-TjRKAUBYIPM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-VCDjsR23srU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-pcBPcaxIpF8');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-UWLCkNDfs38');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-ligsoJnZUG8');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s4-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-0puUqvmROB0');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-24MRbfxmyvw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-EZrl33ZeOKI');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-Njvk_YuqIiE');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-GHFrt55Q7Ls');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-8c-YmCHkG0Y');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-ltM8HL_DSnI');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-CBTmPL7CPb0');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-8n-O6Z8LIVk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-prUi92IAcYk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-XxWOLlCLxYU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-VJNimZEIvhw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-O6jWTqIcTwA');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-YSVNZIO885g');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-o1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-o1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v--_53ReXJDWI');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-hP_s07YZK8s');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-o2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-o2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-J656zMtJ6e4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s5-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-GAQy1yfh5Uo');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-UjeG9GUFIzw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-aM4Iley-6Wc');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-v-2X4RYBfm-KE');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s1-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s1-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s2-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s3-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-s3-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-fw-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-fw-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-fw-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-fw-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-fw-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'soc-fw-6');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'vlsi-v0-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'vlsi-v0-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'vlsi-v1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'vlsi-v1-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'vlsi-v2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'vlsi-v2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'vlsi-v2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'vlsi-v4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'vlsi-v4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'vlsi-v4-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m1-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m1-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m1-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m2-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m2-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m2-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m3-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m3-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m3-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m3-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m3-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m4-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m4-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m4-5');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m4-6');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m5-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m5-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m5-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'rtl-m5-4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-Ff07-u9cQaI');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-I9ySNos57eU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-3yCZuVgAfK0');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-iqgAKamVUvg');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-FkxtU4Uc6ow');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-am6xVuvC18k');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-pkSscCXyfB4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-xzq-BXwz4Bk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-KdZ0mMG_d9I');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-yHX9ex7vY08');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-8PyzzB0OOBk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-_pBvuiLPkNM');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-aWSauzBO8uo');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-95zhfuptcG0');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-3rN-IaeyqEo');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-tI9o_kVkGYk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-uFAq0-WSq6Q');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-tM7SJtO7gHw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-i5rl1ev1EJs');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-N2T24p34Rxc');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-6t5ZGoQcV0k');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-PxETSrcTGBk');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-Zd0o5wI9NPw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-9lCQtrHovP0');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-AhHeNFjrkn8');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-Deik4eDPrDU');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-dfBUbo-f05k');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-ldbNQkbPF1Y');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-T5o17Lepce4');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-3X4hhcsd3_I');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-fhQl4Ac3ox8');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-WPMsr4_gxk8');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-v-S7Q3hfJ1Pgw');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-o3-3');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-o4-1');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(3,'os-o4-2');
INSERT OR IGNORE INTO prep_focus_items(focus_id,item_id) VALUES(1,'rtl-m1-1');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a1-01','arch','arch-p3','Name the three hazard types in a pipeline and one fix for each.','Structural (two instructions need one resource): duplicate or split the resource. Data (an operand is not ready): forwarding/bypassing or stalling. Control (next PC unknown): branch prediction, early branch resolution, or flushing.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a1-02','arch','arch-p3','In a classic 5-stage pipeline with full forwarding, which data hazard still needs a stall?','Load-use: a load''s data is available only at the end of MEM, so a dependent instruction right after it must stall 1 cycle (or the compiler schedules an independent instruction there).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a1-03','arch','arch-p4','Which dependences does register renaming remove, and which remain?','Renaming removes false (name) dependences: WAR (anti) and WAW (output). True RAW dependences remain and are honored by waiting for the producer''s value.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a1-04','arch','arch-p4','Tomasulo''s algorithm: what do reservation stations and the common data bus (CDB) do?','Reservation stations hold issued instructions with operand values or the tag of the producing station (implicit renaming). When a unit finishes, it broadcasts (tag, value) on the CDB; every waiting station whose tag matches captures the value and can then fire.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a1-05','arch','arch-p4','Why does an out-of-order core add a reorder buffer (ROB)?','Instructions execute out of order but retire (commit) in program order from the ROB head. That gives precise exceptions and lets the core undo mispredicted or faulting speculation by flushing younger ROB entries.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a1-06','arch','arch-p4','What is memory disambiguation in the load-store queue?','Deciding whether a load may execute before older stores whose addresses are unknown. Cores speculate that it can, check addresses when the stores resolve, and squash/replay the load on a violation; a memory-dependence predictor (e.g., store sets) avoids repeat violations.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a1-07','arch','arch-p4','What is store-to-load forwarding?','If a load''s address matches an older, not-yet-committed store in the store queue, the load takes its data directly from that store entry instead of from the cache.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a1-08','arch','arch-p4','How does a 2-bit saturating counter predictor differ from a 1-bit one, and what does gshare add?','A 2-bit counter needs two wrong outcomes to flip its prediction, so a loop exit costs one mispredict instead of two. gshare XORs global branch history with PC bits to index the counter table, capturing correlation between branches.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a2-01','arch','arch-x1','DRAM latency for a row hit, a closed (empty) row, and a row conflict?','Hit: tCL (column access only). Closed row: tRCD + tCL (activate, then read). Conflict: tRP + tRCD + tCL (precharge the open row, activate the new one, then read).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a2-02','arch','arch-x1','Why must DRAM be refreshed, and what does refresh cost?','Each cell is a capacitor that leaks charge, so every row must be refreshed within the retention window (64 ms classically, 32 ms in DDR5). Refresh blocks banks, costing bandwidth, latency and energy, and the cost grows with chip density.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a2-03','arch','arch-p5','Write the AMAT formula for a two-level cache.','AMAT = HT_L1 + MR_L1 x (HT_L2 + MR_L2,local x MissPenalty_L2). The L2 miss rate here is local (L2 misses / L2 accesses).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a2-04','arch','arch-p5','What are the 3 Cs of cache misses and a remedy for each?','Compulsory (first touch): prefetching or larger blocks. Capacity (working set too large): bigger cache or tiling. Conflict (too many blocks map to one set): higher associativity or a victim cache. Multiprocessors add a 4th: coherence misses.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a2-05','arch','arch-p5','Compare write-back + write-allocate with write-through + no-write-allocate.','Write-back writes the lower level only on eviction of a dirty line (needs a dirty bit, less traffic); write-allocate fetches the line on a write miss. Write-through updates the lower level on every write (simpler coherence, more traffic, usually with a write buffer) and often pairs with no-write-allocate.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a2-06','arch','arch-p5','Define prefetch accuracy, coverage and timeliness.','Accuracy = useful prefetches / prefetches issued. Coverage = misses eliminated / misses without prefetching. Timeliness = the data arrives before the demand access but not so early that it is evicted first.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a2-07','arch','arch-p5','What constraint lets a VIPT L1 cache avoid synonyms (aliasing)?','The index (plus block offset) bits must come from the page offset: cache size / associativity <= page size. Example: 32 KB, 8-way with 4 KB pages (32K/8 = 4K).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a2-08','arch','arch-p5','What is TLB reach, and how do huge pages change it?','Reach = number of TLB entries x page size. 64 entries x 4 KB = 256 KB; with 2 MB pages it becomes 128 MB, cutting TLB misses for large working sets.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a3-01','arch','arch-p4','Vector processor vs array processor (SIMD)?','Array processor: many PEs do the same operation at the same time (space). Vector processor: one pipelined unit streams the elements over successive cycles (time). Real designs mix both (several pipelined lanes).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a3-02','arch','arch-x2','Coherence vs consistency?','Coherence: all cores agree on the order of writes to a single address. Consistency: the rules for the order in which accesses to different addresses become visible. A machine can be coherent and still weakly consistent.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a3-03','arch','arch-x2','What does sequential consistency guarantee, and what does x86-TSO relax?','SC: the result equals some interleaving of all threads'' operations, each thread in program order. TSO lets a later load bypass an earlier store to a different address (via the store buffer); other orders are kept, so a fence is needed only for store-to-load ordering.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a3-04','arch','arch-x2','Give the MESI states and why E exists.','Modified (dirty, only copy), Exclusive (clean, only copy), Shared (clean, possibly other copies), Invalid. E lets a core write a line it read alone without a bus transaction (silent E to M upgrade).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a3-05','arch','arch-x2','Snooping vs directory coherence?','Snooping broadcasts every miss on a shared bus or ring; simple but bandwidth does not scale. A directory at the home node tracks the sharers and sends point-to-point invalidations, which scales to many cores at the cost of storage and indirection latency.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a3-06','arch','arch-x2','What is false sharing?','Two cores write different variables that sit in the same cache line, so the line ping-pongs between their caches although no data is shared. Fix: pad or align the variables to separate lines.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a3-07','arch','arch-x2','Diameter and bisection width of a k x k 2D mesh and a k x k torus?','Mesh: diameter 2(k-1), bisection k links. Torus: diameter 2 x floor(k/2), bisection 2k links (the wraparound links double it).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a3-08','arch','arch-x2','Wormhole flow control and virtual channels in one breath?','Wormhole splits packets into flits and lets the head flit move on as soon as the next router has a buffer, with the body following. Virtual channels add separate buffer queues per physical link, which reduces head-of-line blocking and can break routing deadlock.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a4-01','arch','arch-x1','Processing-using-memory (PuM) vs processing-near-memory (PnM)?','PuM computes with the memory arrays'' own analog properties (e.g., DRAM charge sharing in Ambit, SIMDRAM). PnM puts logic next to the arrays (in the DRAM die or base die), e.g., UPMEM DPUs, Samsung HBM-PIM, SK hynix AiM.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a4-02','arch','arch-x1','How does Ambit compute bulk bitwise AND/OR in DRAM?','Triple-row activation: opening three rows at once makes each bitline settle to the majority of the three cells, MAJ(A,B,C). With C = 0 that is AND, with C = 1 it is OR. NOT uses dual-contact cells; operands are first copied with RowClone.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a4-03','arch','arch-x1','What is SIMDRAM?','A framework that runs arbitrary operations in DRAM bit-serially: data is laid out vertically (one bit per row per element), operations are built as MAJ/NOT circuits and run as sequences of row activations, processing a whole row (thousands of elements) in parallel.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a4-04','arch','arch-x1','UPMEM vs HBM-PIM vs AiM in one line each.','UPMEM: general-purpose in-order cores (DPUs), one per DRAM bank, programmed in C. Samsung HBM-PIM: FP16 SIMD units near the banks in HBM2. SK hynix AiM: GDDR6 with MAC units per bank, aimed at GEMV for inference.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a4-05','arch','arch-x1','What is RowHammer?','Repeatedly activating an aggressor DRAM row disturbs neighboring victim rows and flips their bits before refresh. Thresholds have fallen sharply with scaling (tens of thousands of activations in early DDR3 to a few thousand in newer chips). RowPress is a variant that keeps the row open longer.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a4-06','arch','arch-x1','Name RowHammer mitigations and their weaknesses.','Faster refresh (costly); PARA (probabilistic neighbor refresh); in-DRAM TRR (bypassed by many-sided patterns such as TRRespass); ECC (multi-bit flips get through); DDR5 PRAC (per-row activation counters with Alert Back-Off, JEDEC 2024) counts exactly at some area and timing cost.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a4-07','arch','arch-x1','SECDED for a 64-bit word: how many check bits, and why?','8 check bits, (72,64). Hamming needs 7 for single-error correction (2^7 >= 64 + 7 + 1); one extra overall parity bit adds double-error detection.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-arch-a4-08','arch','arch-x1','What does DDR5 on-die ECC do, and what does it not do?','Inside the chip it corrects single-bit errors (SEC) per 128-bit data word with 8 parity bits, mainly to protect yield and retention. It does not report errors to the host and is not end-to-end, so systems still use rank-level ECC (SECDED or Chipkill/SDDC).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m1-01','mlir','mlir-m1','What are the core building blocks of MLIR IR?','Operations (with operands, results, attributes and regions), regions containing blocks, blocks containing ops and ending in a terminator, SSA values, types and attributes. Dialects group related ops, types and attributes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m1-02','mlir','mlir-m1','How does MLIR express what LLVM IR does with phi nodes?','Block arguments: a branch passes values to the successor block''s arguments, which play the role of phi nodes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m1-03','mlir','mlir-m1','What is progressive lowering?','Lowering in many small steps through dialects at decreasing abstraction (e.g., tosa/stablehlo -> linalg -> scf/affine + memref -> cf/arith -> llvm), so each pass can optimize at the level where the information is still visible.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m1-04','mlir','mlir-m1','Name the common front-door dialects for importing a neural network into upstream MLIR.','TOSA (a fixed set of tensor operators), StableHLO (from JAX/XLA), and torch-mlir''s torch dialect, which lowers to linalg/tosa. ONNX models arrive via onnx-mlir or torch-mlir''s ONNX importer.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m1-05','mlir','mlir-m1','What does linalg.generic describe?','A perfectly nested loop computation: input/output operands, an affine indexing map per operand, an iterator type per loop (parallel or reduction), and a region with the scalar body. Named ops like linalg.matmul are specializations.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m1-06','mlir','mlir-m1','Dialect conversion vs greedy pattern rewriting?','Greedy rewriting applies patterns until a fixed point (canonicalization, local optimizations). Dialect conversion lowers with a ConversionTarget declaring legal/illegal ops plus a TypeConverter, and fails if illegal ops remain.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m1-07','mlir','mlir-m1','What are traits and interfaces in MLIR?','Traits are static properties of an op (e.g., Pure, Terminator, SameOperandsAndResultType). Interfaces are virtual APIs ops implement (e.g., TilingInterface, MemoryEffectOpInterface) so generic passes work on any dialect that implements them.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m1-08','mlir','mlir-m1','What does the canonicalize pass do?','Applies each op''s canonicalization patterns and folders (constant folding, simplifications) plus dead-code removal, bringing IR to a normal form so later passes can match patterns reliably.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m2-01','mlir','mlir-m2','What does tile-and-fuse do?','Tiles the consumer op (e.g., a matmul''s output), then computes producer ops (e.g., fill, elementwise) inside the same tile loop on just the slice that tile needs, so intermediates stay in fast memory instead of round-tripping through DRAM.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m2-02','mlir','mlir-m2','What is TilingInterface for?','An op interface that exposes an op''s iteration domain, loop types and how to produce a tiled slice of it, so generic tiling and fusion transformations work on any op that implements it (linalg ops, tensor.pad, and custom ops).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m2-03','mlir','mlir-m2','What is the transform dialect?','Ops that describe a transformation schedule (match, tile, fuse, vectorize, bufferize) as IR applied by an interpreter to payload IR. It separates what is computed from how it is optimized, like Halide/TVM schedules, without recompiling the compiler.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m2-04','mlir','mlir-m2','Tensors vs memrefs in MLIR?','Tensors are immutable SSA values with value semantics (no aliasing, easy to transform). Memrefs are references to buffers in memory with layout, so writes are side effects. Bufferization converts tensors to memrefs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m2-05','mlir','mlir-m2','What is One-Shot Bufferization?','A whole-function (or module) analysis that bufferizes tensor ops in one pass, deciding per use whether it can write in place or must allocate a copy, based on alias and read-after-write conflict analysis.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m2-06','mlir','mlir-m2','What is destination-passing style and why does bufferization like it?','Ops take an ''init''/destination tensor (outs) that the result is written into. Bufferization can then reuse the destination''s buffer for the result, giving in-place updates with no extra allocation.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m2-07','mlir','mlir-m2','Why tile before bufferizing in most pipelines?','Tiling and fusion on tensors operate on SSA values with no aliasing, so legality is easy; after bufferization, transformations must reason about memory side effects and aliasing.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m4-01','mlir','mlir-m4','What is a phi node in LLVM IR?','An instruction at the start of a basic block that picks a value based on which predecessor control came from, e.g., %x = phi i32 [%a, %bb1], [%b, %bb2]. It is how SSA merges values at control-flow joins.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m4-02','mlir','mlir-m4','What does getelementptr (GEP) do, and what does it not do?','It computes an address from a base pointer and indices using the type''s layout. It never accesses memory; a load or store does that.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m4-03','mlir','mlir-m4','Why does the front end emit allocas, and what turns them into SSA?','Clang emits every local as an alloca with loads/stores (easy to generate). mem2reg/SROA promote them to SSA registers and insert phi nodes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m4-04','mlir','mlir-m4','Name five core LLVM middle-end passes and what they do.','SROA/mem2reg (memory to SSA), InstCombine (peephole algebraic simplification), SimplifyCFG (merge/remove blocks and branches), GVN (redundancy elimination), LICM (hoist loop-invariant code); plus the inliner and the loop and SLP vectorizers.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m4-05','mlir','mlir-m4','Order the SelectionDAG instruction-selection steps.','Build the DAG per basic block from IR, combine, legalize types, combine, legalize operations, combine, select (TableGen patterns map DAG nodes to target machine nodes), then schedule into MachineInstrs. Register allocation runs later.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m4-06','mlir','mlir-m4','What does ''legalization'' mean in an LLVM backend?','Rewriting types and operations the target does not support natively: e.g., splitting i128 into i64 pieces, promoting i8 to i32, or expanding an unsupported op into a sequence or a libcall.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m4-07','mlir','mlir-m4','What is GlobalISel?','LLVM''s newer instruction-selection framework that works on whole functions on generic MachineInstrs (IRTranslator, Legalizer, RegBankSelect, InstructionSelect) instead of per-block DAGs. AArch64 uses it at -O0 by default.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m3-01','mlir','mlir-m3','What is the general shape of a vendor MLIR accelerator stack?','Import (torch/stablehlo/tosa) -> graph-level dialect with fusion and partitioning -> a kernel-level dialect that captures the hardware''s tiling and memory levels -> target intrinsic dialect (e.g., rocdl/amdgpu for AMD, nvvm/nvgpu for NVIDIA) -> LLVM IR or a vendor backend.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m3-02','mlir','mlir-m3','What is rocMLIR?','AMD''s MLIR-based kernel generator for convolution, GEMM and attention on AMD GPUs; MIGraphX calls it to generate fused kernels, lowering through its own dialect to the amdgpu/rocdl dialects and LLVM''s AMDGPU backend.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m3-03','mlir','mlir-m3','Why is an NPU dialect stack (such as HIVM for Ascend) a good analogue for a PIM backend?','Both target a non-GPU accelerator with explicit memory levels, special compute units and DMA between buffers; the compiler must model those units, place data across buffers and schedule transfers, just as a PIM backend models banks, subarrays and in-memory ops.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m3-04','mlir','mlir-m3','What must an MLIR-based PIM compiler decide beyond what a GPU compiler decides?','Where data lives in the memory arrays (layout/mapping to banks, rows or crossbars), which ops run in memory vs on the host, the schedule of in-memory primitives (e.g., MAGIC NOR or SIMDRAM MAJ/NOT sequences) and the cost of data movement between arrays.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m3-05','mlir','mlir-m3','Why model a scheduling problem as a MIP (mixed-integer program), and what is the trade-off?','A MIP expresses resource, dependence and capacity constraints exactly and gives optimal or bounded-gap schedules. The trade-off is solve time that grows quickly with problem size, so large graphs need partitioning, heuristics or time limits.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m3-06','mlir','mlir-m3','Why use a genetic algorithm for mapping?','The mapping space (operator or tile to array assignment) is huge, discrete and has a non-differentiable cost; a GA explores it with a fitness from a cost model or simulator, giving good, not provably optimal, solutions in bounded time.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m3-07','mlir','mlir-m3','What does a cycle-level DRAM simulator such as Ramulator 2 give a PIM compiler?','Timing of the generated DRAM command sequences (activations, precharges, refresh, bank conflicts) under real timing constraints, so schedules and mapping costs can be checked against more than an analytical model.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m5-01','mlir','mlir-m5','TVM vs MLIR in one line each.','TVM is a complete end-to-end ML compiler with its own IRs (Relax graph IR, TensorIR) and auto-tuning. MLIR is infrastructure for building compilers from reusable dialects; it is not a complete ML compiler by itself.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m5-02','mlir','mlir-m5','What are TensorIR and MetaSchedule in TVM?','TensorIR is TVM''s loop-level IR for tensor programs, transformed with schedule primitives (split, reorder, tile, bind, tensorize). MetaSchedule searches those schedules automatically using measurements and a learned cost model.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m5-03','mlir','mlir-m5','What is MLC-LLM?','A TVM-based project that compiles LLMs for many backends (CUDA, ROCm, Metal, Vulkan, WebGPU, mobile) from one model definition, showing ML compilation as a portability tool.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m5-04','mlir','mlir-m5','What are StableHLO and HLO in OpenXLA?','StableHLO is a versioned MLIR dialect that frameworks (JAX, TensorFlow, PyTorch/XLA) emit as XLA''s input. XLA converts it to HLO, its internal graph IR, where it runs fusion, layout assignment and sharding before backend codegen.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m5-05','mlir','mlir-m5','What is PJRT?','OpenXLA''s runtime plugin interface between frameworks and hardware backends (CPU, GPU, TPU and third-party devices), so a framework can target a new device by loading its PJRT plugin.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m5-06','mlir','mlir-m5','What is XLA''s most important optimization, and why?','Operator fusion: merging elementwise and reduction ops into fewer kernels avoids writing intermediates to HBM, and most ML ops outside matmul are memory-bound.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlir-m5-07','mlir','mlir-m5','How does PyTorch 2''s torch.compile pipeline work?','TorchDynamo captures Python bytecode into FX graphs (with guards and graph breaks), AOTAutograd traces the backward graph, and TorchInductor generates fused Triton kernels for GPUs (C++/OpenMP for CPUs).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s1-01','soc','soc-l1','MPU vs MCU vs SoC?','MPU: a processor chip that relies on external memory and peripherals. MCU: CPU + flash + SRAM + peripherals on one chip, low power and real-time. SoC: one chip with multiple processors, accelerators, memory controllers and an interconnect, usually running a full OS.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s1-02','soc','soc-extra','Name the AMBA protocols from simplest to most capable.','APB (simple, unpipelined, for low-bandwidth peripheral registers) -> AHB (pipelined, bursts) -> AXI (separate channels, multiple outstanding and out-of-order transactions) -> ACE (AXI + coherence) -> CHI (packet-based coherent protocol for meshes).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s1-03','soc','soc-extra','What are AXI''s five channels?','Write address (AW), write data (W), write response (B), read address (AR), read data (R). Reads and writes are independent, so they can proceed in parallel.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s1-04','soc','soc-extra','State the AXI VALID/READY handshake rules.','A transfer happens on a clock edge where VALID and READY are both high. The source must not wait for READY before asserting VALID, and once VALID is asserted it must stay high with stable data until the handshake. READY may depend on VALID.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s1-05','soc','soc-extra','What do AXI IDs enable?','Multiple outstanding transactions that may complete out of order across different IDs; responses with the same ID return in order. Interconnects extend IDs to route responses back to the right manager.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s1-06','soc','soc-extra','AXI burst types and limits (AXI4)?','FIXED (same address, e.g., a FIFO), INCR (incrementing, up to 256 beats), WRAP (wraps at an aligned boundary for cache-line fills; 2, 4, 8 or 16 beats). A burst must not cross a 4 KB address boundary.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s1-07','soc','soc-extra','What are CHI''s main node types?','RN (request nodes: RN-F fully coherent with a cache, RN-I I/O-coherent), HN (home nodes: HN-F manages coherence and often holds the system cache/snoop filter), SN (subordinate nodes such as memory controllers). Messages travel on REQ, RSP, SNP and DAT channels.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s1-08','soc','soc-extra','Why move from buses to a network-on-chip?','A shared bus serializes traffic and its long wires limit frequency as cores are added. A NoC sends packets (split into flits) through routers over short point-to-point links, giving concurrent transfers, scalable bandwidth and modular layout.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s4-01','soc','soc-l2','Write the processor performance equation.','CPU time = instruction count x CPI x clock period (= IC x CPI / f). The ISA and compiler drive IC, the microarchitecture drives CPI, and technology plus pipelining set f.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s4-02','soc','soc-l3','What are the steps of compile-assemble-link-load (CALL)?','Compiler: C to assembly. Assembler: assembly to an object file (machine code, symbol table, relocation info). Linker: combines objects and libraries and resolves symbols into an executable. Loader: maps the program into memory, sets up the stack and arguments, and jumps to the entry point.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s4-03','soc','soc-l3','RISC-V calling convention: argument, return, saved and temporary registers?','a0-a7 (x10-x17) arguments, a0-a1 return values, ra (x1) return address, sp (x2) stack pointer, s0-s11 callee-saved, t0-t6 caller-saved. x0 is hardwired to zero.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s4-04','soc','soc-l3','What do RISC-V base ISA names and extension letters mean?','RV32I/RV64I is the integer base. M = multiply/divide, A = atomics, F/D = single/double float, C = compressed 16-bit, V = vector. G = IMAFD + Zicsr + Zifencei. Profiles such as RVA23 make V mandatory for application processors.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s4-05','soc','soc-l3','How do accelerator teams add custom operations to RISC-V?','Through the reserved custom opcode spaces (custom-0 to custom-3) or as a separate extension (e.g., matrix or PIM ops), with a coprocessor interface to the accelerator; standard toolchains still build the base code.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s4-06','soc','soc-l3','What does a function prologue and epilogue do in RISC-V?','Prologue: decrement sp to make a frame, save ra and any s-registers the function uses. Epilogue: restore them, increment sp, and return with ret (jalr x0, 0(ra)).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s4-07','soc','soc-l2','Why is the ISA called the hardware/software contract?','It fixes what software sees (instructions, registers, memory model, privilege modes) while leaving the implementation free, so the same binaries run on very different microarchitectures.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s2-01','soc','soc-l5','What is memory-mapped I/O (MMIO)?','Device registers appear at physical addresses, so the CPU controls a device with ordinary loads and stores. Those addresses are mapped uncached (device memory) so accesses have side effects and are not merged or reordered.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s2-02','soc','soc-l5','Polling vs interrupts?','Polling: the CPU repeatedly reads a status register (low latency, wastes cycles). Interrupts: the device signals the CPU when it needs attention (efficient for rare events, but each interrupt has entry/exit overhead). High-rate drivers often mix them (e.g., Linux NAPI).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s2-03','soc','soc-l5','What does a DMA engine do, and what does a descriptor contain?','It moves data between memory and devices without the CPU copying it. A descriptor holds source address, destination address, length, control flags (e.g., interrupt on completion) and a pointer to the next descriptor, forming a chain or ring for scatter-gather.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s2-04','soc','soc-l5','Narrate MMIO doorbell -> DMA -> completion.','The driver writes descriptors into a ring in host memory, then writes a doorbell register (MMIO). The device DMA-reads the descriptors, moves the data, writes a completion entry to memory and raises an interrupt (MSI-X). The driver''s handler reads the completion and recycles the buffers.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s2-05','soc','soc-extra','PCIe topology and layers?','Root complex (in the CPU) -> switches -> endpoints. Layers: transaction (TLPs: memory read/write, completions, config, messages), data link (sequence numbers, LCRC, ACK/NAK replay, flow-control DLLPs) and physical (lanes, encoding, link training).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s2-06','soc','soc-extra','Posted vs non-posted PCIe transactions?','Memory writes are posted: no completion is returned. Memory reads are non-posted: the requester waits for completion TLPs carrying the data. MSI/MSI-X interrupts are just posted memory writes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s2-07','soc','soc-extra','PCIe Gen5 and Gen6 rates for an x16 link?','Gen5: 32 GT/s per lane, 128b/130b, about 63 GB/s per direction for x16. Gen6: 64 GT/s with PAM4 signaling, FLIT mode and FEC, about 121 GB/s per direction for x16.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s2-08','soc','soc-extra','What do CXL.io, CXL.cache and CXL.mem do, and what are device types 1-3?','CXL runs on the PCIe physical layer. .io = PCIe-like discovery and DMA; .cache = the device coherently caches host memory; .mem = the host accesses device-attached memory with loads/stores. Type 1: .io+.cache (e.g., smart NIC); Type 2: all three (accelerator with memory); Type 3: .io+.mem (memory expansion and pooling).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s3-01','soc','soc-extra','Write the dynamic power equation and say why DVFS gives near-cubic savings.','P_dyn = alpha x C x V^2 x f. Maximum frequency scales roughly with V, so lowering V and f together cuts power by about the cube; energy per operation falls about with V^2.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s3-02','soc','soc-extra','What is clock gating, and why use an integrated clock-gating (ICG) cell?','Stop the clock to idle registers to remove their switching power. An ICG uses a latch that holds the enable while the clock is high, so the gated clock cannot glitch.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s3-03','soc','soc-extra','What is power gating, and what does it cost?','Header (PMOS) or footer (NMOS) switches cut the supply to an idle block to remove leakage. Costs: switch area and IR drop, wake-up latency and rush current, plus lost state unless retention registers save it.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s3-04','soc','soc-extra','What do isolation cells do?','They clamp the outputs of a powered-down domain to a known 0/1 so floating signals do not corrupt or draw current in powered-on logic. They sit at domain boundaries and are controlled from an always-on domain.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s3-05','soc','soc-extra','When are level shifters needed?','When a signal crosses between domains at different voltages: a low-to-high crossing can leave the receiving PMOS partly on (leakage, wrong levels), so a level shifter restores full swing.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s3-06','soc','soc-extra','What is a retention register?','A flip-flop with an always-on ''balloon'' latch that keeps its state while the main domain is power-gated, allowing fast resume without reloading the state.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s3-07','soc','soc-extra','How is power intent captured in a design flow?','In UPF (IEEE 1801): power domains, supply nets, switches, isolation, level-shifter and retention strategies, and power states. It travels alongside the RTL through simulation, synthesis, P&R and signoff.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s5-01','soc','soc-l8','Outline a typical SoC boot sequence.','Reset -> on-chip boot ROM runs (immutable, often verifies signatures for secure boot) -> loads the first-stage bootloader from flash/eMMC/SPI into on-chip SRAM -> it initializes clocks and trains DRAM -> loads the next stage (e.g., U-Boot or UEFI) into DRAM -> loads and starts the OS kernel.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s5-02','soc','soc-l8','Why can a hold violation found in silicon not be fixed by lowering the clock frequency?','Hold slack = (t_clk-q + t_logic,min) - (t_hold + skew) does not involve the clock period. It can only be helped by changing voltage/temperature (which shifts delays) or by physically adding delay (metal ECO, FIB edit).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s5-03','soc','soc-l8','What is a FIB circuit edit?','A focused ion beam cuts or deposits metal on a fabricated die to rewire a net, e.g., to test a bug fix or insert delay before paying for a new mask set.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s5-04','soc','soc-l8','What visibility do post-silicon debug engineers rely on?','JTAG/debug access ports, scan dumps of flip-flop state, on-chip trace buffers and logic analyzers, performance counters, and shmoo plots (pass/fail over voltage and frequency).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s5-05','soc','soc-l8','What is a shmoo plot used for?','Mapping pass/fail across two parameters (usually voltage and frequency) to find the operating window and to tell timing (frequency-dependent) failures from other failures.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s5-06','soc','soc-l8','Why is DRAM initialization done by an early bootloader running from SRAM?','DRAM is not usable until its controller and PHY are configured and trained, so that code must run from on-chip SRAM (or cache-as-RAM) first.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s5-07','soc','soc-l8','What are scan chains and JTAG used for?','Scan links the flip-flops into shift registers for ATPG manufacturing tests and to dump internal state during debug; JTAG (IEEE 1149.1) is the standard test-access port used to reach scan, boundary scan and debug logic.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s6-01','soc','soc-l5','Name the blocks of a typical AI-accelerator SoC.','Host interface (PCIe/CXL) with DMA engines; control processors (often RISC-V) running firmware; compute tiles (matrix/vector units) with SRAM scratchpads; a NoC; HBM controllers and PHYs; die-to-die links for scale-out; separate clock/power domains; security and management blocks.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s6-02','soc','soc-l5','Narrate one kernel launch on an accelerator card end to end.','Host driver copies or pins inputs, writes a command (kernel ID, buffer addresses) into a queue in host or device memory, rings a doorbell via MMIO. Firmware parses it, programs DMA from host or HBM into scratchpads, runs the tiles, DMAs results back, writes a completion and raises MSI-X; the driver wakes the waiting process.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s6-03','soc','soc-extra','Trace an AXI burst read with two outstanding requests.','Manager sends AR #1 (ID 0, INCR, 4 beats) and AR #2 (ID 1) without waiting. Subordinate returns R beats tagged with IDs; ID 1 data may come first. Each burst ends with RLAST on its final beat; RRESP gives the status per beat.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s6-04','soc','soc-l6','Why do accelerators use software-managed SRAM scratchpads rather than caches?','ML access patterns are static and known at compile time, so the compiler can schedule explicit DMA double-buffering; scratchpads avoid tag and coherence overhead and give deterministic latency.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s6-05','soc','soc-l5','What is double buffering?','Split a scratchpad into two halves: compute on one while DMA fills the other, then swap. Transfer time hides behind compute when compute time >= transfer time.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s6-06','soc','soc-extra','Why does an accelerator use several clock domains?','The host interface, HBM PHY, NoC and compute tiles have different frequency and voltage needs. Separate domains with clock-domain-crossing synchronizers or async FIFOs let each run at its best point and be gated independently.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-soc-s6-07','soc','soc-l6','How large must a scratchpad be to double-buffer a GEMM tile?','2 x (A tile + B tile bytes) for the two input buffers, plus the output/accumulator tile (often in higher precision). Example: 64x64 BF16 A and B tiles = 16 KB per buffer set, 32 KB doubled, plus a 16 KB FP32 accumulator = 48 KB.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v0-01','vlsi','vlsi-v0','List the digital chip design flow from spec to tape-out.','Spec/architecture -> RTL design -> functional verification -> logic synthesis (with constraints) -> DFT insertion -> floorplan -> power plan -> placement -> clock-tree synthesis -> routing -> signoff (STA, DRC, LVS, IR drop/EM, equivalence checking) -> GDSII tape-out.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v0-02','vlsi','vlsi-v0','What are the inputs to physical design?','Gate-level netlist, timing constraints (SDC), standard-cell and macro physical views (LEF), timing/power libraries (Liberty .lib), technology files and parasitic (RC) models.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v0-03','vlsi','vlsi-v0','What does floorplanning decide?','Die/core size and aspect ratio, placement of macros (SRAMs, IP), I/O pin locations, power-domain regions and blockages, aiming for short critical connections and routability.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v0-04','vlsi','vlsi-v0','What does clock-tree synthesis (CTS) aim for, and why is hold fixed after it?','It builds a buffered clock network that meets skew, latency and slew targets. Before CTS clocks are ideal; after it real skew is known, so hold violations can be measured and fixed with delay buffers.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v0-05','vlsi','vlsi-v0','What do DRC and LVS check?','DRC: the layout obeys the foundry''s geometric rules (widths, spacings, enclosures, density). LVS: the layout''s extracted netlist matches the schematic/netlist, devices and connectivity.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v0-06','vlsi','vlsi-v0','What are IR drop and electromigration?','IR drop: voltage falls along the power grid (V = I x R), slowing cells. Electromigration: high current density moves metal atoms over time, opening or shorting wires. Both are checked at signoff and fixed with wider or denser power straps.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v0-07','vlsi','vlsi-v0','What does logic synthesis do?','Maps RTL to a gate-level netlist of library cells, optimizing for timing (from SDC), area and power; it includes technology-independent optimization and technology mapping.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v1-01','vlsi','vlsi-v1','What is velocity saturation and how does it change drain current?','At high lateral fields, carrier velocity saturates, so in short-channel devices saturation current grows roughly linearly with (Vgs - Vt) instead of quadratically, and it saturates at a lower Vds.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v1-02','vlsi','vlsi-v1','Why is gate delay roughly proportional to C x V / I?','A gate must charge or discharge its load capacitance C through a voltage swing V with drive current I: t is about C x V / I. In RC form, t_p is about 0.69 x R_eq x C_L.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v1-03','vlsi','vlsi-v1','Name the components of CMOS power.','Dynamic switching: alpha x C x V^2 x f. Short-circuit: both networks conduct briefly during input transitions. Static leakage: subthreshold, gate and junction leakage, which flows even when idle.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v1-04','vlsi','vlsi-v1','Define the noise margins NM_H and NM_L.','NM_H = V_OH - V_IH and NM_L = V_IL - V_OL, where V_IL and V_IH are the input voltages at which the inverter''s VTC slope is -1.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v1-05','vlsi','vlsi-v1','Why does subthreshold leakage rise sharply as V_t is lowered?','Below threshold, current depends exponentially on (V_gs - V_t), with a subthreshold slope of at least about 60 mV/decade at room temperature. Lowering V_t by 60-100 mV raises leakage by about 10x.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v1-06','vlsi','vlsi-v1','Draw a 2-input static CMOS NAND and NOR in words.','NAND: two NMOS in series to ground, two PMOS in parallel to VDD. NOR: two NMOS in parallel, two PMOS in series. NAND is preferred because series PMOS (slow holes) hurt NOR.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v1-07','vlsi','vlsi-v1','Why is energy-delay product (EDP) used as a metric?','Energy alone favors running very slowly at low voltage, and delay alone favors high voltage. EDP (or ED^2P) balances the two to compare designs fairly across voltage.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v2-01','vlsi','vlsi-v2','Latch vs flip-flop?','A latch is level-sensitive: transparent while the clock is at one level. A flip-flop is edge-triggered: it samples only at the clock edge (often built from two latches in master-slave form).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v2-02','vlsi','vlsi-v2','Define t_setup, t_hold and t_clk-q.','Setup: data must be stable this long before the capturing edge. Hold: data must stay stable this long after the edge. Clk-to-Q: delay from the clock edge to a valid output.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v2-03','vlsi','vlsi-v2','State the setup constraint with clock skew.','T_clk >= t_clk-q + t_logic,max + t_setup - skew, where skew = capture clock arrival - launch clock arrival. Positive skew (capture clock later) helps setup.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v2-04','vlsi','vlsi-v2','State the hold constraint with clock skew.','t_clk-q + t_logic,min >= t_hold + skew. Positive skew hurts hold. The clock period does not appear, so lowering frequency cannot fix hold.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v2-05','vlsi','vlsi-v2','How is slack defined in STA?','Slack = required time - arrival time for setup (and arrival - required for hold). Negative slack is a violation; WNS is the worst slack and TNS the sum of negative slacks.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v2-06','vlsi','vlsi-v2','How are setup violations fixed late in the flow?','Upsize cells or swap to lower-V_t (faster, leakier) cells, insert buffers on long wires, reroute or use wider/upper metal, adjust useful skew, or restructure logic early enough. Late ECOs avoid logic changes to protect verification.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v2-07','vlsi','vlsi-v2','How are hold violations fixed?','Add delay buffers/cells on the short data path (usually near the capture flop), or adjust skew, checking that the added delay does not create setup violations.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v2-08','vlsi','vlsi-v2','What is useful skew?','Intentionally delaying the clock to a capture flop (or advancing it) to borrow time for a critical path from the neighboring stage that has slack.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v4-01','vlsi','vlsi-v4','Name the transistors of a 6T SRAM cell.','Two cross-coupled inverters (2 pull-up PMOS, 2 pull-down NMOS) store the bit; two NMOS access transistors connect the storage nodes to bitlines BL and BLB when the wordline is high.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v4-02','vlsi','vlsi-v4','Describe a 6T read.','Precharge BL and BLB to VDD, raise the wordline; the side storing 0 discharges its bitline through access + pull-down. A sense amplifier detects the small differential (around 100 mV) and resolves it.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v4-03','vlsi','vlsi-v4','What sizing makes a 6T read non-destructive?','The pull-down must be stronger than the access transistor (cell ratio = (W/L)_PD / (W/L)_access, typically > 1.2-2), so the 0 node rises only slightly and does not flip the cell.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v4-04','vlsi','vlsi-v4','What sizing makes a 6T write succeed?','The access transistor must be stronger than the pull-up PMOS (pull-up ratio = (W/L)_PU / (W/L)_access small), so a bitline driven to 0 can pull the 1 node low enough to flip the cell. Order of strength: PD > access > PU.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v4-05','vlsi','vlsi-v4','What is static noise margin (SNM), and how is it measured?','The largest DC noise the cell tolerates before flipping: the side of the largest square that fits in the lobes of the butterfly curve (the two inverter VTCs overlaid). Read SNM is lower than hold SNM because the access transistor loads the 0 node.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v4-06','vlsi','vlsi-v4','Why does compute-in-memory stress SRAM stability?','CIM turns on many wordlines at once and lets bitlines swing far to represent analog sums; that raises read-disturb risk in 6T cells. Designs use 8T/10T cells with decoupled read ports, limited bitline swing or lower wordline voltage.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v4-07','vlsi','vlsi-v4','How does an 8T cell fix read disturb?','It adds a separate read port (two NMOS driving a read bitline), so reads never connect the storage nodes to a bitline; read SNM equals hold SNM at the cost of area.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-vlsi-v4-08','vlsi','vlsi-v4','Why are SRAM bitlines read with a small swing?','Bitlines have large capacitance (many cells attached); letting them swing fully would be slow and energy-hungry, so a sense amplifier resolves a small differential of about 100 mV.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g1-01','gpu','gpu-g1','What is SIMT?','Single instruction, multiple threads: programs are written per thread, but hardware groups threads into warps (32 on NVIDIA) that issue one instruction together, each thread with its own registers and lane.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g1-02','gpu','gpu-g1','What is warp divergence, and what does it cost?','When threads in a warp take different branch paths, the warp runs each path in turn with inactive lanes masked off. Throughput drops by up to the number of distinct paths.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g1-03','gpu','gpu-g1','How do GPUs hide memory latency?','Fine-grained multithreading: each SM keeps many warps resident and switches to a ready warp every cycle at no cost, so while some wait on memory others compute. This needs lots of registers and enough parallelism (occupancy).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g1-04','gpu','gpu-g1','What is an SM, and what does an H100 SM contain?','A streaming multiprocessor is the GPU core. An H100 SM has 4 sub-partitions, each with a warp scheduler, CUDA cores and a 4th-generation tensor core, plus a 256 KB register file and 256 KB of combined L1/shared memory. H100 SXM has 132 SMs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g1-05','gpu','gpu-g1','What is a tensor core?','A unit that performs a small matrix multiply-accumulate (D = A x B + C) per instruction on low-precision inputs (FP16/BF16, TF32, FP8, INT8; FP4 on Blackwell) with higher-precision accumulation, giving most of a modern GPU''s FLOPs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g1-06','gpu','gpu-g1','H100 SXM headline memory numbers?','80 GB HBM3 at about 3.35 TB/s, 50 MB L2, up to 228 KB shared memory per SM, and about 989 TFLOPS dense BF16 (about 1979 TFLOPS dense FP8).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g1-07','gpu','gpu-g1','What did Hopper add for data movement?','The Tensor Memory Accelerator (TMA) for asynchronous bulk copies of tensor tiles between global and shared memory, thread block clusters with distributed shared memory, and asynchronous warpgroup MMA (wgmma).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g2-01','gpu','gpu-g2','State the roofline model.','Attainable FLOP/s = min(peak FLOP/s, arithmetic intensity x memory bandwidth). Arithmetic intensity = FLOPs / bytes moved from memory. The ridge point = peak / bandwidth.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g2-02','gpu','gpu-g2','H100 SXM ridge point for dense BF16?','About 989 TFLOP/s / 3.35 TB/s, roughly 295 FLOP/byte. Kernels below that intensity are memory-bound.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g2-03','gpu','gpu-g2','What is memory coalescing?','When the 32 threads of a warp access consecutive addresses, the hardware combines them into a few 32-byte sector transactions. Strided or scattered access needs many transactions and wastes bandwidth.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g2-04','gpu','gpu-g2','What is occupancy, and what limits it?','Active warps per SM / maximum warps per SM (64 on H100). Limited by registers per thread, shared memory per block and threads per block. Higher occupancy hides latency better, but it is not a goal in itself.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g2-05','gpu','gpu-g2','Why does shared-memory tiling speed up GEMM?','Each block loads a tile of A and B into shared memory once and reuses every element across a tile''s worth of outputs, raising arithmetic intensity by about the tile size instead of reading each operand from DRAM for each output.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g2-06','gpu','gpu-g2','What are shared-memory bank conflicts?','Shared memory has 32 banks of 4 bytes; if several threads in a warp hit different addresses in the same bank, accesses serialize. Fix with padding (e.g., a 33-column tile) or swizzled layouts.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g2-07','gpu','gpu-g2','GPU tensor core vs TPU systolic array?','A tensor core is a small MMA unit inside each SM, fed from registers/shared memory by many threads. A TPU MXU is a large systolic array (128x128; 256x256 from v6e) that streams operands through neighboring PEs with weights held in place, under compiler (XLA) control.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g2-08','gpu','gpu-g2','What is the arithmetic intensity of an N x N x N GEMM in BF16 with perfect reuse?','FLOPs = 2N^3; bytes = 3N^2 x 2 = 6N^2; intensity = N/3 FLOP/byte. N = 4096 gives about 1365, well above the H100 ridge.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g3-01','gpu','gpu-g3','CUDA global thread index and grid size for N elements with 256-thread blocks?','i = blockIdx.x * blockDim.x + threadIdx.x; grid = (N + 255) / 256 blocks; guard with if (i < N) since the last block may be partial.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g3-02','gpu','gpu-g3','Host vs device memory in CUDA?','The host (CPU) allocates device memory with cudaMalloc and copies with cudaMemcpy (or uses unified/managed memory). Kernels run on the device and launch asynchronously with <<<grid, block, sharedBytes, stream>>>.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g3-03','gpu','gpu-g3','What does __syncthreads() do, and what is the classic bug?','A barrier for all threads in a block (also orders their shared-memory accesses). Calling it inside a branch that not all threads of the block reach is undefined behavior and can hang.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g3-04','gpu','gpu-g3','Triton''s programming model vs CUDA''s?','CUDA: you program one thread and manage shared memory and synchronization. Triton: you program one block (program instance) operating on tiles of data in Python; the compiler handles thread mapping, coalescing, shared memory and tensor-core use.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g3-05','gpu','gpu-g3','Write the core of a Triton vector add.','pid = tl.program_id(0); offs = pid * BLOCK + tl.arange(0, BLOCK); mask = offs < n; x = tl.load(x_ptr + offs, mask=mask); y = tl.load(y_ptr + offs, mask=mask); tl.store(out_ptr + offs, x + y, mask=mask). BLOCK is a tl.constexpr power of 2.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g3-06','gpu','gpu-g3','Why does a fused row-softmax beat separate kernels?','Unfused: separate passes for max, exp, sum and divide each read/write the row from DRAM. Fused: one block loads the row once into registers/shared memory, computes max, exp, sum and normalize there, and writes once, so traffic is about 2N instead of several N.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g3-07','gpu','gpu-g3','What is HIP, and how does it map to CUDA?','AMD''s C++ GPU API on ROCm, almost one-to-one with CUDA (hipMalloc, hipMemcpy, <<<>>> launches); HIPIFY translates CUDA source; HIP code can also compile for NVIDIA. AMD CDNA wavefronts are 64 wide vs 32-thread warps.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g3-08','gpu','gpu-g3','Where does CUTLASS sit?','NVIDIA''s open-source CUDA C++ template library (built on CuTe layouts) for tensor-core GEMM/convolution kernels with custom fusions; between hand-written CUDA and closed libraries like cuBLAS. Triton is the Python-level alternative.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g4-01','gpu','gpu-g4','Why is standard attention memory-bound, and what does FlashAttention change?','Naive attention writes the N x N score and probability matrices to HBM and reads them back. FlashAttention tiles Q, K and V into SRAM and uses an online softmax, so the N x N matrix is never stored: HBM traffic drops from O(N^2) to roughly O(N^2 d^2 / M) for SRAM size M, and memory becomes O(N).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g4-02','gpu','gpu-g4','How does online softmax work?','Process K/V blocks one by one, keeping a running max m and running sum l per query row. When a block raises the max, rescale the old sum and partial output by exp(m_old - m_new), then add the new block''s contribution; divide by l at the end.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g4-03','gpu','gpu-g4','FlashAttention 1 -> 2 -> 3 in one sentence each.','FA1: IO-aware tiling + online softmax + recomputation in the backward pass. FA2: fewer non-matmul FLOPs, parallelism over the sequence dimension and better warp work partitioning. FA3: Hopper-specific: warp specialization with TMA producers and WGMMA consumers, overlapping softmax with GEMMs, and FP8.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g4-04','gpu','gpu-g4','Why does batch-1 decode underuse a GPU?','Each step has one query token per sequence, so attention is a matrix-vector product over the KV cache with intensity near 1 FLOP/byte, and few query blocks exist to spread across the 100+ SMs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g4-05','gpu','gpu-g4','What is Flash-Decoding (split-KV)?','Split the KV sequence into chunks processed by different thread blocks in parallel; each produces a partial output with its own max and sum, and a final reduction combines them with log-sum-exp rescaling. It fills the GPU even at batch 1 with long contexts.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g4-06','gpu','gpu-g4','What does FlashInfer provide for serving?','Attention kernels for paged and ragged KV caches (variable-length batches), split-KV decode with load balancing across requests, and kernels for prefix sharing, used by serving engines such as SGLang and vLLM.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g4-07','gpu','gpu-g4','Why is decode attention a natural PIM target?','It streams the whole KV cache once per token with little reuse (GEMV-like, about 1 FLOP/byte), so it is bound by memory bandwidth; computing next to or in memory uses internal bank bandwidth that is much higher than the external interface.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-gpu-g4-08','gpu','gpu-g4','What does a paged KV cache require from the attention kernel?','K and V for a sequence are scattered in fixed-size blocks, so the kernel looks up a block table and gathers blocks (one extra indirection) instead of reading one contiguous array; FlashInfer and vLLM kernels do this natively.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l1-01','mlsys','mlsys-l1','Write scaled dot-product attention and its cost in sequence length n.','Attention(Q,K,V) = softmax(Q K^T / sqrt(d_k)) V. Compute and score-matrix memory grow as O(n^2 d) and O(n^2) per head (FlashAttention removes the O(n^2) memory, not the compute).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l1-02','mlsys','mlsys-l1','Why divide by sqrt(d_k)?','Dot products of d_k-dimensional vectors with unit-variance entries have variance d_k; scaling keeps logits around unit variance so the softmax does not saturate and gradients stay usable.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l1-03','mlsys','mlsys-l1','MHA vs MQA vs GQA?','MHA: every query head has its own K/V head. MQA: all query heads share one K/V head. GQA: query heads are split into groups that share K/V heads (e.g., 64 query heads, 8 KV heads). KV cache shrinks by n_heads / n_kv_heads; GQA keeps most of MHA''s quality.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l1-04','mlsys','mlsys-l1','What does RoPE do?','Rotary position embedding rotates each pair of query/key dimensions by an angle proportional to the token position (different frequency per pair), so the q.k dot product depends only on relative position. Context extension methods (NTK/YaRN) rescale those frequencies.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l1-05','mlsys','mlsys-l1','RMSNorm vs LayerNorm, and pre-norm vs post-norm?','RMSNorm divides by the root-mean-square only (no mean subtraction or bias), which is cheaper and works as well. Modern LLMs use pre-norm (normalize the input of each sublayer), which trains more stably than the original post-norm.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l1-06','mlsys','mlsys-l1','What is SwiGLU?','A gated MLP: FFN(x) = W_2 (SiLU(W_1 x) * W_3 x). It uses three matrices, so the hidden size is usually cut to about 8/3 d to keep parameter count equal to a 4d ReLU/GELU MLP.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l1-07','mlsys','mlsys-l1','What is a mixture-of-experts (MoE) layer?','The MLP is replaced by many experts and a router that sends each token to its top-k experts. Total parameters grow while active compute per token stays small; e.g., DeepSeek-V3 has 671B total and 37B active parameters. An auxiliary loss or bias-based balancing keeps experts evenly loaded.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l1-08','mlsys','mlsys-l1','SSMs (Mamba) and linear attention vs softmax attention?','Both give a recurrent form with a fixed-size state, so per-token decode cost and memory are constant in sequence length (no growing KV cache), versus O(n) KV for attention. Mamba makes the SSM parameters input-dependent (selective). Hybrids mix a few attention layers with many linear/SSM layers to keep recall.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l2-01','mlsys','mlsys-l2','Why is prefill compute-bound and decode memory-bound?','Prefill processes all prompt tokens at once (GEMMs with many rows, high intensity). Decode generates one token per sequence per step, so each step reads all weights and the KV cache for a few FLOPs per byte (GEMV-like).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l2-02','mlsys','mlsys-l2','Batch-1 decode speed limit for a model with P parameters in BF16?','Every token reads about 2P bytes of weights, so tokens/s <= bandwidth / 2P. A 70B model needs 140 GB per token: at 3.35 TB/s that is at most about 24 tokens/s (and it needs 2+ GPUs to fit).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l2-03','mlsys','mlsys-l2','What are continuous batching and PagedAttention (vLLM)?','Continuous batching adds and removes requests at every decode step so the batch stays full. PagedAttention stores the KV cache in fixed-size blocks (pages) mapped through a per-sequence block table, like virtual memory. It removes most fragmentation and over-reservation, and lets sequences share prefix blocks (copy-on-write).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l2-04','mlsys','mlsys-l2','What is prefill/decode disaggregation?','Running prefill and decode on separate GPU pools, transferring the KV cache between them, so long prefills do not stall decode latency and each phase can use its own parallelism and hardware (e.g., DistServe, Splitwise, NVIDIA Dynamo, llm-d).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l2-05','mlsys','mlsys-l2','Weight-only vs weight-and-activation quantization?','Weight-only (e.g., W4A16 with GPTQ/AWQ) cuts the bytes read and speeds memory-bound decode; math still runs in 16-bit. W8A8 or FP8 (e.g., SmoothQuant) also quantizes activations so the tensor cores run low-precision math, helping compute-bound prefill.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l2-06','mlsys','mlsys-l2','FP8 E4M3 vs E5M2, and what are MXFP4 and NVFP4?','E4M3: more mantissa, max 448 (weights/activations). E5M2: more range, max 57344 (gradients). MXFP4: FP4 (E2M1) values in blocks of 32 sharing an 8-bit power-of-two scale (E8M0). NVFP4: blocks of 16 with an FP8 E4M3 scale plus a per-tensor FP32 scale.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l2-07','mlsys','mlsys-l2','Tensor, pipeline, data and expert parallelism?','TP splits each matmul across GPUs (Megatron: 2 all-reduces per layer in the forward pass; needs NVLink). PP splits layers into stages (bubbles, needs micro-batches). DP replicates the model and splits the batch. EP places experts on different GPUs with all-to-all token routing.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l2-08','mlsys','mlsys-l2','How does speculative decoding work, and why is it lossless?','A cheap draft (small model, Medusa/EAGLE heads, or n-gram lookup) proposes k tokens; the target model checks all of them in one forward pass and accepts a prefix. Rejection sampling makes the output distribution exactly the target''s; speedup depends on the acceptance rate.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l3-01','mlsys','mlsys-l3','ONNX in one line.','A framework-neutral file format for ML models: a graph of operators from versioned operator sets plus weights, which runtimes (ONNX Runtime, TensorRT) and compilers import.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l3-02','mlsys','mlsys-l3','LLVM in one line.','A compiler infrastructure built around a typed SSA IR, with a reusable optimizer and backends for many targets; MLIR pipelines usually end by lowering to LLVM IR.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l3-03','mlsys','mlsys-l3','KV-cache bytes per token for a 70B GQA model (80 layers, 8 KV heads, head dim 128, BF16)?','2 (K and V) x 80 x 8 x 128 x 2 bytes = 327,680 bytes, about 0.33 MB per token. 8K tokens is about 2.7 GB per sequence; batch 64 at 8K is about 172 GB.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l3-04','mlsys','mlsys-l3','Decode arithmetic intensity at batch 1 vs batch 64 (weights only)?','Each parameter does 2 FLOPs per token and is 2 bytes in BF16: about 1 FLOP/byte at batch 1, about 64 FLOP/byte at batch 64. KV-cache reads are per sequence and do not amortize, so long contexts pull intensity back down.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l3-05','mlsys','mlsys-l3','What batch size makes BF16 decode compute-bound on H100, ignoring KV?','Intensity of about B FLOP/byte must reach the ridge of about 295 FLOP/byte, so B is around 300. In practice the KV cache and latency targets keep decode memory-bound.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l3-06','mlsys','mlsys-l3','What does PIM change in the decode picture?','It computes the GEMV-like parts (weight and KV reads) inside or next to the DRAM banks, using internal bank-level bandwidth several times the external bus, so memory-bound work speeds up and data movement energy falls; compute-bound prefill stays on the GPU.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-mlsys-l3-07','mlsys','mlsys-l3','Memory to serve a 70B BF16 model at batch 64 with 8K context each?','Weights about 140 GB plus KV about 172 GB is about 312 GB before activations and overhead: more than four 80 GB H100s, so in practice 8 GPUs, or FP8/INT4 weights and an FP8 KV cache.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x1-01','accel','accel-x1','What is a systolic array?','A grid of simple PEs that pass data to their neighbors every cycle; each PE does a multiply-accumulate. Operands are reused as they flow, so one memory read feeds many MACs, and wires stay short.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x1-02','accel','accel-x1','Weight-stationary vs output-stationary vs input-stationary?','WS: weights are preloaded and stay in PEs while inputs stream and partial sums flow (TPU). OS: each PE keeps one output''s partial sum while inputs and weights stream past. IS: inputs stay put while weights stream. The stationary operand is the one reused most locally.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x1-03','accel','accel-x1','What is Eyeriss''s row-stationary dataflow?','Each PE handles a 1D row convolution, keeping a filter row and an input row in its local storage, with partial sums accumulated across PEs; it balances reuse of weights, inputs and partial sums to minimize total data-movement energy.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x1-04','accel','accel-x1','Why does data reuse dominate accelerator energy?','A DRAM access costs roughly 100-1000x the energy of an on-chip MAC, and large SRAM accesses also cost much more than register-file accesses, so dataflows aim to fetch each value from far memory once and reuse it from small local storage.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x1-05','accel','accel-x1','Define operational intensity and the ridge point.','Operational intensity = FLOPs per byte of DRAM traffic. Ridge point = peak compute / memory bandwidth; kernels with intensity below it are memory-bound, above it compute-bound.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x1-06','accel','accel-x1','What limits systolic-array utilization?','Fill and drain cycles at each tile, operands smaller than the array (e.g., small batch or narrow layers leave rows/columns idle), and weight reload time if it is not overlapped.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x1-07','accel','accel-x1','Map a 1024x1024x1024 GEMM onto a 128x128 weight-stationary array.','64 weight tiles (8 x 8). Each streams 1024 input rows: about 1024 + 2x128 fill/drain = 1280 cycles. Total about 82K cycles vs the ideal 65,536 (2 x 1024^3 FLOPs / (2 x 128^2 per cycle)): about 80% utilization if weight loads are overlapped.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x2-01','accel','accel-x2','Google Ironwood (TPU v7) headline numbers?','About 4.6 PFLOP/s FP8 per chip, 192 GB HBM3E at about 7.4 TB/s, and pods of up to 9,216 chips linked by ICI; Google positions it as its first TPU designed mainly for inference.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x2-02','accel','accel-x2','AMD MI350 series (CDNA 4) in one card.','Chiplet design with 8 compute dies (XCDs, TSMC N3P) on 2 I/O dies, 288 GB HBM3E at 8 TB/s, and new MXFP6/MXFP4 support for low-precision inference; MI355X is the liquid-cooled, higher-power version.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x2-03','accel','accel-x2','What is NVIDIA GB10?','The Grace Blackwell superchip in DGX Spark: a 20-core Arm CPU die (built with MediaTek) and a Blackwell GPU die joined by NVLink-C2C, sharing 128 GB of LPDDR5X unified memory, about 1 PFLOP FP4 with sparsity.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x2-04','accel','accel-x2','What is d-Matrix Corsair''s approach?','Digital in-memory compute: MACs built into SRAM arrays (no analog ADCs), packaged as chiplets with large on-chip SRAM plus LPDDR for capacity, using block floating-point formats, aimed at low-latency LLM inference.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x2-05','accel','accel-x2','Digital SRAM-CIM vs analog CIM trade-off?','Digital CIM is exact and scales with logic process nodes but gives up some density/energy; analog CIM sums currents or charges on bitlines for high efficiency but needs ADCs and suffers from noise, variation and limited precision.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x2-06','accel','accel-x2','What is Huawei''s UB-Mesh?','A datacenter network design for large AI clusters that uses a hierarchical nD-FullMesh topology over Huawei''s Unified Bus, linking nearby chips directly to cut switch and optical-module cost versus a Clos fat-tree.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-accel-x2-07','accel','accel-x2','Why do all 2025 AI chips push memory capacity and bandwidth?','LLM inference, especially decode and long contexts, is bound by weight and KV-cache bandwidth and capacity, not FLOPs; hence more HBM stacks, larger SRAM, low-bit formats and in- or near-memory compute.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o0-01','os','os-u2','What do fork, exec and wait do?','fork creates a copy of the calling process and returns 0 in the child and the child''s PID in the parent. exec replaces the process image with a new program (same PID). wait blocks until a child exits and collects its status.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o0-02','os','os-u2','What is a zombie process, and what is an orphan?','Zombie: a child that has exited but whose parent has not called wait, so its PID and exit status remain. Orphan: a child whose parent exited; it is re-parented to init (or a subreaper), which reaps it.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o0-03','os','os-u1','What is limited direct execution?','User code runs directly on the CPU in user mode for speed; privileged operations require a trap into kernel mode, and a timer interrupt guarantees the kernel regains control so it can switch processes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o0-04','os','os-u1','What happens on a system call?','The program places arguments in registers and executes a trap instruction (syscall on x86-64, ecall on RISC-V). The CPU switches to kernel mode and jumps to a handler set up at boot; the kernel saves user state, validates and dispatches the call, then returns to user mode.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o0-05','os','os-u2','What state does the OS keep for a process?','In the process control block: PID, state (running, ready, blocked), saved registers and PC, address-space pointer (page tables), open files, credentials and scheduling information.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o0-06','os','os-u2','Why separate fork and exec?','Between them the child can set up its environment (redirect file descriptors, change directory, set limits) before running the new program; this is how shells implement redirection and pipes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o0-07','os','os-u1','User mode vs kernel mode?','Hardware privilege levels: in user mode, privileged instructions (I/O, changing the page-table base, disabling interrupts) trap instead of executing. x86 uses ring 3 vs ring 0; RISC-V has U, S and M modes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o1-01','os','os-u4','How does a TLB miss get handled on x86 vs classic MIPS?','x86 (and Arm, RISC-V usually): a hardware page-table walker reads the page tables and fills the TLB. Classic MIPS: a software-managed TLB raises an exception and the OS handler refills it.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o1-02','os','os-u4','x86-64 4-level paging: how is a 48-bit virtual address split?','Four 9-bit indices (PML4, PDPT, PD, PT; 512 eight-byte entries each, so one 4 KB page per table) and a 12-bit page offset. 5-level paging extends to 57 bits.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o1-03','os','os-u4','Trace a load that misses the TLB and page-faults.','TLB miss -> hardware walk finds the PTE not present -> page-fault exception into the kernel -> kernel checks the address is valid (VMA) -> allocates a frame, evicting one if needed, and reads the page from disk/swap or zeroes it -> updates the PTE -> returns -> the load re-executes, misses the TLB again, walks and fills it, then completes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o1-04','os','os-u4','Minor vs major page fault?','Minor: the page is already in memory (e.g., page cache or a copy-on-write share) and only the mapping must be set. Major: the data must be read from disk/swap, costing milliseconds.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o1-05','os','os-u4','What do ASIDs/PCIDs solve?','They tag TLB entries with an address-space ID so a context switch does not have to flush the TLB; entries for other processes simply do not match.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o1-06','os','os-u8','Name page-replacement policies and Belady''s anomaly.','OPT (evict the page used furthest in the future; ideal), FIFO, LRU, and Clock (a second-chance approximation of LRU using reference bits). Belady''s anomaly: with FIFO, more frames can cause more faults.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o1-07','os','os-u8','What is thrashing?','When the combined working sets of running processes exceed physical memory, the system spends most of its time paging; fixes are reducing the multiprogramming level or adding memory.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o1-08','os','os-u1','What happens in hardware and kernel on an interrupt?','The device raises an interrupt; the CPU finishes the current instruction, saves PC and flags, switches to kernel mode and jumps through the interrupt vector table to a handler, which acknowledges the device, does minimal work (deferring the rest) and returns.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o2-01','os','os-u5','Process vs thread?','Threads of one process share the address space, heap, globals and open files, but each has its own registers, PC and stack. Switching threads in the same process avoids a page-table switch.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o2-02','os','os-u5','Implement a spinlock with compare-and-swap.','lock: while (!CAS(&l, 0, 1)) spin; unlock: store 0. The CAS needs acquire semantics and the unlock store release semantics (or fences) so critical-section accesses cannot move outside the lock.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o2-03','os','os-u5','Why must condition-variable waits use a while loop?','With Mesa semantics, a signal only makes the waiter runnable; another thread may change the state first, and spurious wakeups are allowed, so the waiter must recheck the condition after reacquiring the mutex.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o2-04','os','os-u5','Semaphore vs mutex?','A semaphore is a counter with wait (P: decrement, block at 0) and post (V: increment, wake one). A mutex is ownership-based mutual exclusion (like a binary semaphore but only the owner unlocks). Semaphores also count resources and signal events.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o2-05','os','os-u5','What are the four conditions for deadlock?','Mutual exclusion, hold and wait, no preemption, circular wait. Breaking any one prevents deadlock; the common fix is a global lock ordering to rule out circular wait.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o2-06','os','os-u5','What is priority inversion and a fix?','A high-priority thread waits on a lock held by a low-priority thread, which a medium-priority thread preempts, so the high-priority thread waits indefinitely. Fix: priority inheritance (the holder temporarily gets the waiter''s priority).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o2-07','os','os-u5','Why do locks connect to cache coherence and consistency?','Atomic RMW instructions get the line in exclusive (M) state via coherence; fences or acquire/release order surrounding accesses on weak memory models. Spinning with test-and-test-and-set reads locally in S state to avoid coherence traffic.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o2-08','os','os-u5','Name common concurrency bug types.','Atomicity violations (a check and act that should be atomic are interrupted), order violations (code assumes an order that is not enforced) and deadlocks; data races underlie the first two.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o3-01','os','os-u1','On x86, what does the hardware push when an interrupt arrives in user mode?','It switches to the kernel stack given by the TSS (ss0:esp0), then pushes the user SS and ESP, EFLAGS, CS and EIP (and an error code for some exceptions). xv6''s vector stub pushes the trap number, and alltraps pushes the rest to build a trapframe.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o3-02','os','os-u1','What is the trapframe in xv6?','The saved user register state on the process''s kernel stack (general registers, segment registers, trap number, error code and what the hardware pushed). trap(tf) dispatches on it, and trapret restores it and executes iret.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o3-03','os','os-u3','How does xv6 context-switch between processes?','swtch(&old->context, new_context) pushes the callee-saved registers (ebx, esi, edi, ebp; eip is the return address) on the current kernel stack, saves the stack pointer, loads the other one and pops. Processes switch to the per-CPU scheduler thread and the scheduler switches to the next process.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o3-04','os','os-u3','Trace a timer interrupt that ends in a context switch.','Timer IRQ -> hardware saves user state and switches to the kernel stack -> trap() sees the timer -> yield() -> sched() -> swtch to the scheduler -> scheduler picks a runnable process -> switchuvm sets TSS esp0 and loads its page table into CR3 (flushing non-global TLB entries; ASIDs/PCIDs would avoid this) -> swtch into it -> it returns through trapret and iret to user mode.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o3-05','os','os-extra','How does xv6''s x86 spinlock work, and why disable interrupts?','acquire: pushcli() disables interrupts, then loop on xchg(&lk->locked, 1) until it returns 0 (xchg is atomic and a full barrier). Interrupts are off so an interrupt handler on the same CPU cannot try to take a lock this CPU already holds, which would deadlock.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o3-06','os','os-u5','How do xv6''s sleep and wakeup avoid lost wakeups?','sleep(chan, lk) takes the process-table lock before releasing lk, then marks itself sleeping; wakeup needs the same process-table lock, so a wakeup cannot slip in between checking the condition and going to sleep.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o3-07','os','os-extra','How does the xv6 IDE driver work?','iderw queues a buffer and idestart programs the disk controller with x86 port I/O (outb); the process sleeps on the buffer. When the disk finishes it interrupts, ideintr reads data if needed, marks the buffer valid, wakes the sleeper and starts the next request.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o3-08','os','os-u4','How is the kernel mapped in each xv6 (x86) process?','Every process page table maps the kernel at KERNBASE (0x80000000) and above, so traps need no page-table switch; user memory sits below. Two-level paging: 10-bit directory index, 10-bit table index, 12-bit offset.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o4-01','os','os-extra','What is a Linux kernel module?','Loadable code (.ko) inserted with insmod/modprobe that runs in kernel space; module_init and module_exit register and unregister its functionality, such as a driver.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o4-02','os','os-extra','How does a user-space read() reach a character driver?','The device node (/dev/x) carries a major/minor number; open looks up the cdev registered for it; read() on the file descriptor calls the driver''s file_operations .read, which copies data out with copy_to_user.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o4-03','os','os-extra','Why copy_to_user/copy_from_user instead of a plain memcpy?','User pointers are untrusted and may be invalid or unmapped; these helpers check the range and handle faults safely, returning the number of bytes not copied.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o4-04','os','os-extra','What does ioctl provide?','A device-specific control path for commands that are not plain reads or writes (configuration, queries, starting operations), with a command number and an argument pointer.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o4-05','os','os-extra','Steps in a PCIe driver''s probe for a DMA device.','pci_enable_device, pci_request_regions, map BARs with pci_iomap (MMIO), pci_set_master to allow bus-mastering DMA, dma_set_mask_and_coherent, allocate DMA buffers, set up MSI/MSI-X with pci_alloc_irq_vectors and request_irq.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o4-06','os','os-extra','Coherent vs streaming DMA mappings in Linux?','dma_alloc_coherent gives a long-lived buffer both CPU and device see consistently (e.g., descriptor rings). dma_map_single/dma_map_sg map an existing buffer for one transfer in one direction, with explicit sync and unmap, often for data buffers.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o4-07','os','os-extra','What role does the IOMMU play in device DMA?','It translates device-visible addresses (IOVAs) to physical addresses and restricts each device to its mapped pages, which gives isolation, enables passthrough to VMs, and lets devices with narrow DMA masks reach all memory.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c-os-o4-08','os','os-extra','What is the top half / bottom half split in Linux interrupt handling?','The top half (hard IRQ handler) runs with that interrupt masked and does minimal work, such as acknowledging the device; the rest is deferred to a bottom half (softirq, tasklet, threaded IRQ or workqueue) that runs with interrupts enabled.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p3-01','arch','arch-p3','Why does a k-stage pipeline give less than k x speedup?','Stages are never perfectly balanced (the slowest sets the clock), every stage adds pipeline-register overhead (setup + clock-to-q + skew), and hazards add stall and flush cycles. Past some depth the overhead and the growing branch penalty cancel the gain.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p3-02','arch','arch-p3','Which forwarding paths does a 5-stage pipeline need, and when does the forwarding unit pick each?','EX/MEM -> EX (the producer is one instruction ahead) and MEM/WB -> EX (two ahead). Forward when the older instruction writes a register (RegWrite), its rd is not x0, and rd matches the younger rs1/rs2; the newer EX/MEM value wins if both match.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p3-03','arch','arch-p3','What makes an exception precise?','Every instruction older than the faulting one has updated architectural state, no younger one has, and the saved PC points at the faulting instruction. The handler can then fix the cause and restart as if execution were sequential.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p3-04','arch','arch-p3','Exception vs interrupt?','An exception is synchronous: caused by a specific instruction (page fault, illegal opcode, divide by zero). An interrupt is asynchronous: an external event (timer, I/O). Both are taken at an instruction boundary; interrupts can be delayed until a convenient one.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p3-05','arch','arch-p3','Name three ways besides a reorder buffer to provide precise exceptions.','History buffer (keep old register values and undo on an exception), future file (a speculative register file plus an in-order architectural one), and checkpointing (snapshot the register map at chosen points and roll back). All separate speculative from committed state.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p3-06','arch','arch-p3','What new hazards appear when an in-order pipeline has multi-cycle units (e.g., a 4-cycle FP multiply)?','Instructions can finish out of order, so WAW hazards appear (a later short op writes before an earlier long op) and the register-file write port becomes a structural hazard. A scoreboard tracks busy units and pending destination registers and stalls issue when needed.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p3-07','arch','arch-p3','Why do deeper pipelines have diminishing returns?','Each extra stage adds latch overhead and raises the branch-mispredict and load-use penalties (more stages between fetch and resolution). Power grows with the number of latches and frequency. The best depth balances clock gain against CPI loss.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p3-08','arch','arch-p3','What was the branch delay slot, and why did later ISAs drop it?','The instruction after a branch always executes, so the compiler fills it with useful work while the branch resolves. It ties the ISA to one pipeline depth; with deep or superscalar pipelines one slot no longer hides the penalty, and dynamic prediction does better.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-01','arch','arch-p4','How does renaming with a merged physical register file work?','A register alias table (RAT) maps each architectural register to a physical one. Each destination gets a fresh physical register from the free list; sources read the current mapping. The previous mapping is freed only when the overwriting instruction commits.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-02','arch','arch-p4','How does an OoO core recover the rename map after a branch misprediction?','Either restore a checkpoint of the RAT taken at the branch (fast, but checkpoints are limited), or rebuild the map by walking the ROB back from the tail (slower, no extra storage). Younger instructions are squashed and their physical registers returned to the free list.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-03','arch','arch-p4','Wakeup and select in an issue queue?','Wakeup: when a producer is scheduled, its destination tag is broadcast and matching source operands in the queue are marked ready. Select: an arbiter picks ready instructions (often oldest first) up to the issue width. Doing both in one cycle enables back-to-back dependent issue.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-04','arch','arch-p4','What is load-hit speculation, and what happens when it is wrong?','The scheduler wakes a load''s dependents assuming an L1 hit so they issue just in time. If the load misses, the dependents that already issued got no data and must be cancelled and replayed when the data arrives.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-05','arch','arch-p4','What does a memory dependence predictor (e.g., store sets) do?','It learns which loads have conflicted with which stores. Loads predicted independent issue early; loads predicted dependent wait for the specific store. It keeps the benefit of speculative disambiguation while avoiding repeated squash-and-replay.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-06','arch','arch-p4','How does a TAGE predictor work?','A base bimodal table plus several tagged tables indexed by PC hashed with global histories of geometrically increasing length. The matching table with the longest history gives the prediction; useful bits steer allocation of new entries on mispredicts.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-07','arch','arch-p4','What is a tournament (hybrid) predictor?','Two predictors, typically one using local (per-branch) history and one using global history, plus a chooser table of saturating counters that learns which one is more accurate for each branch. The Alpha 21264 is the classic example.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-08','arch','arch-p4','Why do returns need a return address stack (RAS)?','One return instruction goes back to many different call sites, so a BTB that remembers the last target often mispredicts. The RAS pushes the return address on a call and pops it on a return. It fails on overflow (deep recursion) or corruption by wrong-path calls unless repaired.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-09','arch','arch-p4','What is aliasing in a branch predictor table?','Two unrelated branches index the same counter (limited index bits), so their updates interfere. Mitigations: bigger tables, tagged entries (TAGE), better hashing such as gshare''s PC XOR history, or agree/bi-mode style designs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-10','arch','arch-p4','Why does superscalar width get expensive?','Rename must check dependences inside the group (comparators grow with W^2), the bypass network grows roughly with W^2, register-file ports grow with W, and fetch must cross taken branches. Wider machines also need a bigger window to find enough independent work.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-11','arch','arch-p4','Three classic problems with VLIW?','The compiler schedules statically, so (1) unpredictable latencies such as cache misses stall the whole bundle, (2) unfilled slots become NOPs and bloat the code, and (3) binaries depend on a machine''s width and latencies, which hurts compatibility across generations.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-12','arch','arch-p4','What makes a systolic array efficient for matrix multiply?','Data enters at the edges and moves between neighboring PEs each cycle, so each operand fetched from memory is reused across a whole row or column of MACs. Wiring is local and regular. It suits dense GEMM/convolution and underuses PEs on small or irregular shapes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-13','arch','arch-p4','What is decoupled access-execute?','The program is split into an access stream (address computation and loads) and an execute stream that communicate through hardware queues. The access side runs ahead and acts like an accurate prefetcher, tolerating memory latency without a large OoO window.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-14','arch','arch-p4','What do vector length and vector mask registers do?','The vector length register sets how many elements an instruction processes, so loops of any length can be strip-mined. The mask register predicates elements, so a loop body with an if can be vectorized: only lanes whose mask bit is 1 write results.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-15','arch','arch-p4','What is vector chaining?','Forwarding results element by element from one vector unit to the next, so a dependent instruction (e.g., VADD after VMUL) starts as soon as the first element is ready instead of waiting for the whole vector. It is the vector version of bypassing.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p4-16','arch','arch-p4','How large must the instruction window be to hide a long-latency load?','By Little''s law, about IPC x latency: to keep retiring 4 instructions per cycle across a 100-cycle miss, about 400 instructions must fit in the ROB and its queues. That is why runahead execution and other latency-tolerance techniques exist.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-01','arch','arch-p5','Tag/index/offset for a 64 KB, 4-way cache with 64 B lines and 40-bit physical addresses?','Offset = log2(64) = 6. Sets = 64 KB / (64 B x 4) = 256, so index = 8. Tag = 40 - 8 - 6 = 26 bits.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-02','arch','arch-p5','True LRU vs tree pseudo-LRU: state per set for an 8-way cache?','True LRU must encode an ordering of 8 ways: at least log2(8!) ~ 15.3, so 16 bits (simple matrix designs use more). Tree-PLRU uses N - 1 = 7 bits, one per node of a binary tree pointing toward the less recently used half. PLRU only approximates LRU.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-03','arch','arch-p5','What problem does RRIP-style replacement solve?','LRU puts every new line at MRU, so a large scan or streaming access evicts the whole useful working set. RRIP inserts new lines with a "distant re-reference" prediction and promotes them only on a hit, so scans pass through without thrashing reused data.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-04','arch','arch-p5','Inclusive vs exclusive vs NINE last-level cache?','Inclusive: the LLC holds a copy of every line in the upper caches, so it can filter snoops, but its evictions must back-invalidate upper copies. Exclusive: a line lives in one level only, so total capacity is the sum, but lines move on every L1/L2 eviction. NINE: no guarantee either way.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-05','arch','arch-p5','What is a victim cache?','A small fully associative buffer that holds lines recently evicted from a direct-mapped or low-associativity cache. It is checked on a miss and catches most conflict misses at much lower cost than raising the associativity of the whole cache.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-06','arch','arch-p5','What is an MSHR, and primary vs secondary miss?','A miss status holding register tracks one outstanding miss (line address, waiting destinations) so the cache can keep serving hits under a miss. A primary miss allocates an MSHR and goes to memory; a secondary miss to the same line merges into it. No free MSHR stalls the cache.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-07','arch','arch-p5','Why bank a cache, and what is a bank conflict?','Splitting the data array into independent banks (usually interleaved by line or word address) allows several accesses per cycle with single-ported SRAM. Two accesses in the same cycle to the same bank conflict and one waits.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-08','arch','arch-p5','Critical word first and early restart?','On a miss, memory returns the requested word first (critical word first), or the cache forwards it as soon as it arrives in normal order (early restart). The core resumes before the rest of the line fills, cutting the effective miss penalty.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-09','arch','arch-p5','What does a write buffer add to a write-through cache, and what must loads check?','It holds pending writes so the core does not wait for the next level. A later load that misses must check the buffer for a matching address (or drain it first); otherwise it could read stale data from below.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-10','arch','arch-p5','How does a PC-based stride prefetcher work?','A table indexed by load PC stores the last address, last stride and a confidence state. When the same stride repeats, it prefetches address + k x stride. Indexing by PC separates the patterns of different loads in the same loop.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-11','arch','arch-p5','What do prefetch distance and degree mean?','Distance: how far ahead of the current demand access the prefetcher works (must cover memory latency). Degree: how many prefetches it issues per trigger. Too small: late prefetches; too large: wasted bandwidth and cache pollution.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-12','arch','arch-p5','How many memory references can an x86-64 page walk take?','With 4-level paging and no cached entries, 4 (one per level) before the data access itself. With 5-level paging, 5. Under nested (two-dimensional) paging for VMs, up to 24 references. Page-walk caches skip the upper levels most of the time.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-13','arch','arch-p5','Costs of huge pages?','Internal fragmentation (memory wasted inside a 2 MB page), the OS must find contiguous physical memory (compaction), zeroing and copying a whole page is slower, and protection or swapping happens at coarse granularity.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-14','arch','arch-p5','What does a page-table entry hold?','The physical frame number plus control bits: present/valid, read/write/execute permissions, user/supervisor, accessed (referenced) and dirty bits for the OS, and caching attributes. A missing present bit raises a page fault.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-15','arch','arch-p5','Why use a multi-level page table?','A flat table for a 48-bit space with 4 KB pages would need 2^36 entries per process. A radix tree allocates lower-level tables only for regions in use, so sparse address spaces cost little memory. The cost is more references per walk.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-16','arch','arch-p5','What is a TLB shootdown?','When the OS changes or removes a mapping that other cores may have cached, it must invalidate their TLB entries, usually by sending inter-processor interrupts and waiting for acknowledgments. It is slow, so OSes batch these invalidations.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-p5-17','arch','arch-p5','Why can a stride of exactly the cache way size hurt?','Addresses that differ by a multiple of (number of sets x line size) map to the same set. Walking a power-of-two-strided array (e.g., a matrix column with a 4 KB row pitch) fills one set and causes conflict misses while the rest of the cache sits idle. Padding the row fixes it.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-01','arch','arch-x1','Name the DRAM organization levels from the controller down.','Channel -> DIMM -> rank (chips that answer together) -> chip -> bank group -> bank -> subarray -> row -> column. Banks can work in parallel; each bank has one row buffer.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-02','arch','arch-x1','What are tRAS and tRC?','tRAS: minimum time from ACTIVATE until PRECHARGE may be issued to that bank (the row must be sensed and restored). tRC = tRAS + tRP: minimum time between two ACTIVATEs to the same bank, i.e., the row-cycle time for back-to-back row conflicts.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-03','arch','arch-x1','What do tRRD and tFAW limit, and why?','tRRD is the minimum gap between ACTIVATEs to different banks; tFAW allows at most four ACTIVATEs in a rolling window per rank. Both cap the current drawn by row activation (power delivery and noise), so they limit random-access bandwidth.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-04','arch','arch-x1','Why do memory controllers batch writes (write draining)?','Switching the shared data bus between writes and reads costs turnaround time (tWTR, tRTW). Controllers buffer writes and drain them in bursts when the write queue passes a high watermark or reads are idle, which amortizes the penalty.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-05','arch','arch-x1','What is the fairness problem with FR-FCFS?','Row-hit-first scheduling favors threads with high row-buffer locality and streaming access; threads with random access can starve. Fairness-aware schedulers such as PAR-BS (batching), ATLAS (least attained service) or BLISS (blacklisting) trade a little throughput for fairness.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-06','arch','arch-x1','How does address mapping affect DRAM performance?','Which address bits select channel, bank, row and column decides parallelism and locality. Row-interleaved mapping keeps a sequential stream in one row (more hits); cache-line interleaving spreads it across banks (more parallelism). XOR-hashing bank bits with row bits breaks up conflicts from power-of-two strides.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-07','arch','arch-x1','Typical refresh numbers, and how does refresh overhead scale?','DDR4: one REF every tREFI = 7.8 us (64 ms window); DDR5 normally 3.9 us (32 ms). Each REF blocks the rank for tRFC (hundreds of ns for 8-16 Gb chips). Overhead ~ tRFC / tREFI, and tRFC grows with chip capacity, so refresh costs more each generation.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-08','arch','arch-x1','What idea behind retention-aware refresh (e.g., RAIDR)?','Most rows retain data far longer than the worst-case 64 ms. Profile rows into retention bins and refresh only the weak ones at the full rate, the rest less often. Hard part: retention varies with temperature, data pattern and over time (variable retention time).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-09','arch','arch-x1','What does per-bank (or same-bank) refresh buy?','Instead of an all-bank refresh that blocks the whole rank, one bank (or one bank in each group) is refreshed while the others keep serving reads and writes. It hides much of the refresh latency at the cost of more frequent, smaller refresh operations.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-10','arch','arch-x1','DDR5 vs DDR4 at the channel level?','A DDR5 DIMM has two independent 32-bit subchannels (40 bits with ECC) instead of one 64-bit channel, burst length 16 instead of 8 (still 64 B per burst per subchannel), more bank groups and banks, on-die ECC and an on-DIMM PMIC.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-11','arch','arch-x1','HBM structure in one breath?','Stacked DRAM dies on a base logic die, connected by TSVs, placed next to the processor on a silicon interposer. A very wide interface (1024 bits per stack in HBM3, split into independent channels and pseudo-channels) at moderate pin speed gives high bandwidth per watt; capacity per stack is limited.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-12','arch','arch-x1','What is chipkill-correct ECC?','A symbol-based code (e.g., Reed-Solomon) where each DRAM chip contributes one symbol per codeword. Single-symbol correction then fixes any error confined to one chip, including a whole-chip failure, which SECDED across a 72-bit word cannot.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-13','arch','arch-x1','What is memory scrubbing?','The controller periodically reads every location, corrects single-bit errors and writes the fixed data back (patrol scrubbing), so independent errors do not accumulate in one word into an uncorrectable multi-bit error.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-14','arch','arch-x1','How does a SECDED decoder classify an error?','Syndrome 0 and overall parity correct: no error. Syndrome non-zero and parity wrong: single error, the syndrome points to the bit to flip. Syndrome non-zero and parity correct: double error, detected but uncorrectable. Syndrome 0 and parity wrong: the overall parity bit itself flipped.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-15','arch','arch-x1','What is RowPress?','Keeping an aggressor row open for a long time (large tAggON) instead of activating it many times. It induces bitflips in neighbors with far fewer activations, so mitigations that only count activations can miss it.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-16','arch','arch-x1','Why has RowHammer worsened with scaling?','Smaller cells hold less charge and sit closer together, so electrical coupling from a hammered neighbor flips them sooner. Characterization across DRAM generations shows the activation count needed for the first bitflip dropping sharply in newer chips.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-17','arch','arch-x1','UPMEM DPU in numbers and limits?','One in-order multithreaded DPU per 64 MB DRAM bank (MRAM), with a 64 KB scratchpad (WRAM) and a 24 KB instruction memory, running at a few hundred MHz. DPUs cannot talk to each other directly: all inter-DPU data goes through the host, and 32-bit multiply and floating point are emulated in software.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-18','arch','arch-x1','When does processing-in-memory win, and when does it lose?','Wins: low arithmetic intensity, large data, simple regular operations (GEMV in LLM decode, scans, bitwise ops, embedding lookups), where data movement dominates. Loses: high data reuse (big GEMMs fit caches), irregular communication between banks, or complex operations that the simple in-memory logic cannot do efficiently.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-19','arch','arch-x1','How does Samsung HBM-PIM compute?','It places programmable FP16 SIMD units next to DRAM banks inside the HBM2 dies (one unit shared by a pair of banks). In all-bank mode one command triggers every unit at once, so the aggregate internal bandwidth far exceeds what the external pins can deliver.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-20','arch','arch-x1','How does an analog crossbar compute a matrix-vector product?','Weights are stored as cell conductances G, inputs are applied as row voltages V; by Ohm''s law each cell passes I = G V, and Kirchhoff''s current law sums the currents on each column, so each column current is a dot product. ADCs digitize the column outputs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-21','arch','arch-x1','Why do ADCs dominate analog CIM cost?','Every column (or group of columns) needs an analog-to-digital conversion per operation, and ADC energy and area grow roughly exponentially with resolution. Designs reduce resolution (bit slicing inputs and weights), share ADCs across columns, or limit the number of rows active at once.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-22','arch','arch-x1','Why does data movement dominate energy?','In a classic 45 nm estimate (Horowitz, ISSCC 2014), a 32-bit DRAM access costs roughly 640 pJ while a 32-bit floating-point multiply costs about 4 pJ: over 100x. Moving data, not computing on it, sets the energy budget, which motivates caches, reuse and PIM.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-23','arch','arch-x1','NAND flash basics: why an FTL, and what is write amplification?','Flash pages cannot be overwritten in place: blocks must be erased first, and blocks wear out after limited program/erase cycles. The flash translation layer remaps logical pages, does garbage collection and wear leveling. Write amplification = NAND bytes written / host bytes written; GC copying makes it > 1.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-24','arch','arch-x1','PCM, STT-MRAM and ReRAM in one line each?','PCM: resistance from amorphous vs crystalline phase; dense and multi-level, but slow, energy-hungry writes with limited endurance. STT-MRAM: magnetic tunnel junction; fast, high endurance, low density. ReRAM: filament-based resistance; dense and crossbar-friendly for analog CIM, with variability and limited endurance.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x1-25','arch','arch-x1','What is subarray-level parallelism (SALP)?','A DRAM bank is split into many subarrays with their own local row buffers. SALP lets accesses to different subarrays of the same bank overlap (e.g., precharge one while activating another), reducing the cost of bank conflicts with little extra area.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-01','arch','arch-x2','What does MOESI''s Owned state add?','O = dirty but shared. A core with a line in M can supply data to a reader and move to O instead of writing back to memory first; the reader gets S. The owner stays responsible for the eventual write-back. It saves memory bandwidth for read-shared dirty data.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-02','arch','arch-x2','What does the F (Forward) state in MESIF do?','Among several clean sharers, exactly one is designated to respond to requests, so a read miss gets one cache-to-cache reply instead of many or a slow memory read. Intel uses MESIF.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-03','arch','arch-x2','How much storage does a full-bit-vector directory need, and how is it reduced?','One presence bit per core per line plus state: with 64 cores and 64 B lines that is 64/512 = 12.5% of memory. Reductions: limited-pointer directories, coarse vectors (one bit per group of cores), and sparse directories or snoop filters that track only cached lines.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-04','arch','arch-x2','Three-hop vs four-hop directory transactions?','Read miss to a line dirty elsewhere: requester -> home directory -> owner -> requester (3 hops, the owner replies directly). A 4-hop protocol sends the data back via the home node, which is simpler for ordering but slower.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-05','arch','arch-x2','Message-passing litmus test: is r = 0 allowed?','T1: data = 1; flag = 1. T2: while (flag == 0); r = data. Under SC and x86-TSO, r = 0 is forbidden (stores stay in order, loads stay in order). Under Arm or RISC-V weak ordering it is allowed unless T1 uses a release store (or barrier) and T2 an acquire load.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-06','arch','arch-x2','Load-linked / store-conditional vs compare-and-swap?','LL reads a value and sets a reservation on the line; SC writes only if no other core wrote the line meanwhile (it fails if the reservation was lost). CAS writes only if memory still holds an expected value; it can be fooled by A->B->A changes (the ABA problem), which LL/SC avoids.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-07','arch','arch-x2','Why test-and-test-and-set instead of test-and-set spinning?','Test-and-set writes on every attempt, so the lock line bounces between caches in M state. Test-and-test-and-set spins on a plain read (all waiters share the line in S) and only attempts the atomic when the lock looks free, cutting coherence traffic.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-08','arch','arch-x2','What is feedback-directed prefetch throttling?','The prefetcher measures its own accuracy, lateness and cache pollution at runtime and raises or lowers its aggressiveness (distance and degree). Accurate and late: go more aggressive. Inaccurate or polluting: back off.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-09','arch','arch-x2','Spatial vs temporal prefetchers?','Spatial (e.g., SMS): learn which offsets within a memory region tend to be touched together and prefetch that footprint. Temporal (correlation/Markov): record sequences of miss addresses and replay them when the sequence starts again; they handle pointer chasing but need large metadata.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-10','arch','arch-x2','Spectre v1 in three steps?','A bounds check is mispredicted as in-bounds; the speculative path reads a secret out of bounds and uses it to index a probe array, leaving a line in the cache; after the squash, the attacker times accesses to the probe array to recover the secret. Architectural state is clean, microarchitectural state is not.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-11','arch','arch-x2','Amdahl''s law for an accelerator: 80% of run time is sped up 10x. Overall speedup?','1 / ((1 - 0.8) + 0.8 / 10) = 1 / 0.28 ~ 3.6x. The 20% left on the host caps the speedup at 5x no matter how fast the accelerator.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-12','arch','arch-x2','Stages of a classic NoC router pipeline?','Route computation (RC), virtual-channel allocation (VA), switch allocation (SA), switch traversal (ST), then link traversal (LT). Lookahead routing and speculative allocation shorten it.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-arch-x2-13','arch','arch-x2','How does credit-based flow control work?','The upstream router keeps a credit count of free buffer slots in each downstream virtual channel. It sends a flit only when it has a credit and decrements it; the downstream router returns a credit when the flit leaves its buffer. No flit is ever dropped.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g2-01','gpu','gpu-g2','Occupancy from registers: 65,536 registers per SM, kernel uses 64 registers per thread, SM max 2,048 threads. Occupancy?','65,536 / 64 = 1,024 threads = 32 warps out of 64 possible: 50%. Cutting to 32 registers per thread would allow 100% (if shared memory and block limits allow), possibly at the cost of spills.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g2-02','gpu','gpu-g2','Which shared-memory strides are bank-conflict-free for 4-byte words and 32 banks?','Thread i accessing word s * i hits bank (s * i) mod 32. Any odd stride is conflict-free (coprime with 32). Stride 2 gives 2-way conflicts, stride 32 gives 32-way. Padding a 32-wide tile to 33 columns turns column accesses into stride 33.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g2-03','gpu','gpu-g2','At what granularity do global memory accesses get served?','In 32-byte sectors within 128-byte cache lines. A warp reading 32 consecutive aligned floats touches 4 sectors (128 B); the same read offset by one float touches 5. Scattered accesses can need up to 32 sectors for 128 useful bytes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g2-04','gpu','gpu-g2','Little''s law for a GPU: how much data must be in flight?','Bytes in flight = bandwidth x latency. At 3 TB/s and ~500 ns that is ~1.5 MB of outstanding loads across the chip, which is why GPUs need tens of thousands of resident threads or asynchronous copies to reach peak bandwidth.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g2-05','gpu','gpu-g2','Why is batch-1 GEMV memory-bound, and how does batching change it?','GEMV reads every weight once for 2 FLOPs per weight: about 1 FLOP/byte in FP16, far below a GPU ridge point of hundreds. Batching B requests reuses each weight B times, so intensity grows roughly to B FLOP/byte until the kernel becomes compute-bound.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g1-01','gpu','gpu-g1','What changed with Volta''s independent thread scheduling?','Each thread has its own program counter and call stack, so diverged threads in a warp can interleave and even wait on each other (no deadlock on intra-warp locks). Code can no longer assume implicit warp-synchronous execution: use __syncwarp() and the *_sync intrinsics.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g1-02','gpu','gpu-g1','Are GPU L1 caches hardware-coherent across SMs?','No. Each SM''s L1 is not kept coherent with other SMs; the L2 is the point of coherence. Visibility across blocks needs fences and atomics (or writes that bypass L1), and kernel boundaries give a global synchronization point.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g1-03','gpu','gpu-g1','Warp scheduling policies: loose round-robin vs greedy-then-oldest?','LRR rotates among ready warps, so all warps progress together and tend to hit long-latency loads at the same time. GTO keeps running one warp until it stalls, then picks the oldest; this improves cache locality per warp and staggers stalls.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-vlsi-v4-01','vlsi','vlsi-v4','How does compute-in-SRAM get AND and NOR from a bitline read?','Activate two wordlines at once with the bitlines precharged. BL stays high only if both cells store 1 (any 0 discharges it): AND. BLB stays high only if both store 0: NOR. Sensing both gives the operands for XOR and, with a little peripheral logic, bit-serial addition.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-vlsi-v4-02','vlsi','vlsi-v4','What is half-select disturb?','When a wordline is raised to write some columns, the other cells on that row (not being written) also connect to their precharged bitlines and see a read-like disturb. Column-interleaved arrays must keep those half-selected cells stable, which constrains write assist.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-vlsi-v4-03','vlsi','vlsi-v4','Name a write-assist and a read-assist technique.','Write assist: negative bitline (drive BL below ground) or lower the cell supply during a write so the access transistor wins. Read assist: wordline underdrive (weaker access transistor) or raise cell supply to improve read stability. Both trade margin against speed and power.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-vlsi-v4-04','vlsi','vlsi-v4','Digital vs analog compute-in-SRAM?','Digital CIM reads bits and adds them in adder trees next to the array: exact and scales with logic, but more area. Analog CIM sums charge or current on bitlines: very dense and efficient, but limited by noise, variation and ADC cost.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-l6-01','soc','soc-l6','How do ASIDs (or PCIDs) help context switches?','Each TLB entry is tagged with an address-space identifier, so entries from different processes coexist. A context switch changes the current ASID instead of flushing the whole TLB, avoiding a burst of misses when a process runs again.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-l6-02','soc','soc-l6','Typical TLB hierarchy in a modern core?','Small, fast L1 instruction and data TLBs (tens of entries, often separate arrays per page size), a larger unified second-level TLB (around a thousand or more entries), plus page-walk caches that hold upper-level page-table entries.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-01','accel','accel-x1','Horowitz''s 45 nm energy table: what do an 8-bit add, a 32-bit FP multiply, an SRAM read and a DRAM access cost?','At 45 nm, 0.9 V: INT add 8b 0.03 pJ, 32b 0.1 pJ; INT mult 8b 0.2 pJ, 32b 3.1 pJ; FP add 16b 0.4 pJ, 32b 0.9 pJ; FP mult 16b 1.1 pJ, 32b 3.7 pJ; 64-bit cache read 8 KB 10 pJ, 32 KB 20 pJ, 1 MB 100 pJ; DRAM 1.3-2.6 nJ. So one DRAM access is about 6,500-13,000 8-bit multiplies, and a 1 MB SRAM read is about 500 of them.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-02','accel','accel-x1','Why is a programmable core so much less energy-efficient than an accelerator for the same arithmetic?','Horowitz: a simple in-order core spends about 70 pJ per instruction (I-cache about 25 pJ, register file about 6 pJ, the rest control), while the add itself costs well under 1 pJ. An accelerator amortizes control over thousands of MACs per instruction and keeps operands in PE registers. Reaching about 1 pJ/op needs short integers, tens of ops per local-buffer fetch, and about 1,000 ops per DRAM fetch.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-03','accel','accel-x1','Name the three kinds of data reuse in a convolution layer.','Convolutional reuse: within one channel, the same filter weights and overlapping input pixels are used at many sliding-window positions. Filter (weight) reuse: the same weights apply to every image in the batch. Input-feature-map reuse: the same input activation feeds every output channel (every filter). A dataflow decides which reuse is captured in which storage level.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-04','accel','accel-x1','How do you describe a dataflow as a loop nest?','Write the layer as nested loops (e.g., K, C, R, S, P, Q). A mapping picks (1) the loop order at each memory level: the operand whose indices are absent from the innermost loops stays "stationary"; (2) spatial unrolling: which loops run in parallel across PEs; (3) tiling: loop bounds per level (register, GLB, DRAM). Tools such as Timeloop search this mapping space and Accelergy prices each access to get energy and delay.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-05','accel','accel-x1','Arithmetic intensity of a Tm x Tn output tile with K streamed through (b bytes per element)?','FLOPs = 2*Tm*Tn*K. Bytes moved = b*(Tm + Tn)*K (an A panel and a B panel; C stays on-chip). Intensity = 2*Tm*Tn / (b*(Tm + Tn)). For a square tile T it is T/b. Example: 128 x 128 in BF16 gives 64 FLOP/B; 256 x 256 gives 128 FLOP/B. Bigger tiles mean more reuse, but they need more SRAM.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-06','accel','accel-x1','How large must a square GEMM tile be to be compute-bound against DRAM?','Tile intensity is T/b (b = bytes per element). It must reach the chip ridge point R = peak FLOP/s divided by DRAM bandwidth, so T >= b*R. Example: R = 100 FLOP/B in BF16 needs T >= 200. Halving the precision (FP8) halves the tile needed, which is one reason low precision also helps bandwidth-limited designs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-07','accel','accel-x1','MAC count of a conv layer: formula and a drill (3x3, 64 to 64 channels, 56 x 56 output, batch 1).','MACs = N*K*C*R*S*P*Q. Here 1*64*64*3*3*56*56 = 115,605,504, about 115.6 M MACs or 0.23 GFLOP. Weights = 64*64*9 = 36,864 (36 KB in INT8). Each weight is reused P*Q = 3,136 times, and each input about K*R*S = 576 times (ignoring borders).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-08','accel','accel-x1','Why do depthwise convolutions run poorly on a big systolic array?','Each filter sees only one input channel, so there is no reduction over C. The array dimension that normally holds C (or K) sits mostly idle, and each input is reused only R*S (9) times. Intensity and utilization are low, so designs map depthwise layers to vector units or use special modes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-09','accel','accel-x1','Fill and drain: how do you estimate the cycles and utilization of an R x C weight-stationary array?','With weights preloaded, streaming M input rows takes about M + R + C cycles per fold, because the skewed wavefront needs about R + C cycles to fill and drain. Utilization is about M/(M + R + C). For M = 1024 on 128 x 128 that is about 80%. For batch-1 decode (M = 1) it is under 1%. Weight loading adds about R cycles per fold unless it is double-buffered.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-10','accel','accel-x1','2:4 structured sparsity: what is stored and what is the compression?','In every group of 4 weights, at most 2 are nonzero. Store the 2 values plus a 2-bit index for each. FP16: 64 bits become 2*16 + 2*2 = 36 bits (1.78x). INT8: 32 bits become 20 bits (1.6x). The tensor core selects matching activations with the indices, so it does half the math, for up to 2x throughput.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-11','accel','accel-x1','Zero gating vs zero skipping?','Gating: detect a zero operand and do not toggle the multiplier or the read. This saves energy but no cycles, and the control is simple (Eyeriss). Skipping: keep the data compressed and issue only nonzero work. This saves both energy and cycles, but it needs index logic, scatter of the outputs and load balancing across PEs (EIE, SCNN).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-12','accel','accel-x1','Why are INT8 MACs built with 32-bit accumulators?','An INT8 x INT8 product is at most 2^14 in magnitude ((-128)*(-128) = 16384). A signed 32-bit accumulator holds about 2^31 / 2^14 = 2^17, about 131K, worst-case products before it can overflow. That covers any realistic K. A 16-bit accumulator would overflow after 2 worst-case products. FP8 and FP4 MACs accumulate in FP32 (or a wide fixed-point adder tree) for the same reason.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-13','accel','accel-x1','Mesh NoC numbers worth knowing for a k x k grid.','Diameter 2(k-1) hops; average distance about 2k/3 for uniform random traffic (exactly 2(k^2-1)/(3k), so 5.25 for 8 x 8). Bisection: k links each way. A torus cuts the average to about k/2 and doubles the bisection. Accelerator traffic is mostly multicast (one weight to a row of PEs) and reductions, so designs add broadcast buses or hierarchical meshes (Eyeriss v2).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-14','accel','accel-x1','Input bandwidth needed to feed a 128 x 128 weight-stationary array at 1 GHz with BF16 inputs?','One activation enters each of the 128 rows per cycle: 128 * 2 B = 256 B/cycle = 256 GB/s from the activation buffer. 128 partial sums leave per cycle; in FP32 that is 512 B/cycle. A weight fold is 128*128*2 B = 32 KB. The buffers must be banked (e.g., 8 banks x 32 B ports) to sustain this.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-15','accel','accel-x1','Affine quantization in one card: formula, scales and the integer GEMM.','q = clamp(round(x/s) + z). Symmetric INT8: z = 0, s = max|x|/127. Asymmetric: s = (max - min)/255. Weights: per-output-channel (or per-group, e.g., 128) scales; activations: per-tensor or per-token. GEMM: multiply int8 x int8, accumulate in int32, then multiply by s_w*s_x (per output channel) and requantize in the epilogue.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x1-16','accel','accel-x1','Effective bits per element for MXFP8, MXFP4 and NVFP4?','MX (OCP v1.0): 32 elements share an 8-bit E8M0 (power-of-two) scale, so MXFP8 = 8.25 bits and MXFP4 = 4 + 8/32 = 4.25 bits. NVFP4: 16 FP4 (E2M1) elements share an FP8 E4M3 scale, so 4 + 8/16 = 4.5 bits. Adding one FP32 per-tensor scale over N = 4096 elements gives 4.5078 bits. The finer block and the non-power-of-two scale buy accuracy for 0.25 bit.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x2-01','accel','accel-x2','TPU v1 design point in numbers.','256 x 256 = 65,536 8-bit MACs at 700 MHz gives about 92 TOPS (2 ops per MAC). On chip: 24 MiB unified buffer plus 4 MiB of accumulators. Weights come from 8 GiB of DDR3 at 34 GB/s through a weight FIFO; the matrix unit is a weight-stationary systolic array. Ridge point: about 1,350 MACs per weight byte (about 2,700 ops/B), so most of the production MLPs and LSTMs were memory-bound.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x2-02','accel','accel-x2','What did TPU v4 add at the system level?','275 TFLOP/s peak BF16 per chip (7 nm). Optical circuit switches reconfigure the topology of a 4,096-chip pod (for example a twisted 3D torus) and cost under 5% of system cost and under 3% of power. SparseCores (dataflow units for embeddings) speed up embedding-heavy models 5-7x for about 5% of die area and power. Versus TPU v3: 2.1x performance and 2.7x perf/W.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x2-03','accel','accel-x2','Meta MTIA v1 in one card.','TSMC 7 nm, 800 MHz, 25 W TDP. 64 PEs in an 8 x 8 mesh; each PE has two RISC-V cores (one with vector extensions), fixed-function matmul and nonlinear units, and 128 KB of local SRAM. 128 MB of shared on-chip SRAM, plus 64 GB of LPDDR5 (176 GB/s) instead of HBM. 102.4 TOPS INT8 / 51.2 TFLOP/s FP16. Built for recommendation-model inference.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x2-04','accel','accel-x2','What changed from MTIA v1 to v2?','5 nm, 1.35 GHz (from 800 MHz), about 421 mm^2, 90 W TDP. On-chip SRAM doubled to 256 MB (2.7 TB/s), and LPDDR5 capacity doubled. The design point stays the same: lots of SRAM plus cheap LPDDR (no HBM), tuned for ranking and recommendation models with large embedding tables and modest per-request compute.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x2-05','accel','accel-x2','Microsoft Maia 100 in one card.','About 820 mm^2 on TSMC N5 with CoWoS-S. 64 GB of HBM2E at 1.8 TB/s and about 500 MB of L1/L2. Dense tensor peak: 0.8 POPS BF16, 1.5 POPS at 9-bit, 3 POPS at 6-bit (MX-style narrow formats). 700 W design TDP (500 W provisioned). Backend network 12 x 400 GbE (600 GB/s). BF16 ridge is about 0.8e15 / 1.8e12 = about 444 FLOP/B.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x2-06','accel','accel-x2','Groq LPU: what is unusual about its memory and control?','There is no HBM: each chip has 230 MB of on-die SRAM with up to 80 TB/s of on-die bandwidth. Execution is fully deterministic: the compiler schedules every data movement and functional-unit cycle, so there are no caches or arbitration. Batch-1 decode is fast because the weights stream from SRAM, but a large model must be split across hundreds of chips.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x2-07','accel','accel-x2','Cerebras WSE-3 in one card.','One wafer-scale chip: 46,225 mm^2, 900,000 cores, 44 GB of on-chip SRAM spread across the wafer, 21 PB/s of memory bandwidth and 214 Pb/s of fabric bandwidth. For training large models it uses weight streaming: the weights live in external MemoryX and stream through the wafer layer by layer, while the activations stay on the wafer.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x2-08','accel','accel-x2','SambaNova SN40L: what are the three memory tiers for?','About 520 MiB of on-chip distributed SRAM, 64 GiB of co-packaged HBM, and up to 1.5 TiB of DDR DRAM per socket. It is a reconfigurable dataflow unit that fuses many operators into a spatial pipeline. DDR holds many models or experts (Composition of Experts); HBM caches the active ones, loaded at over 1 TB/s per node.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x2-09','accel','accel-x2','Tenstorrent Tensix core: what is inside?','Five small in-order RISC-V cores: 2 for data movement (one per NoC) and 3 for compute (unpack, math, pack). They drive a matrix engine and a vector engine. About 1.5 MB of SRAM (L1) per core. Two NoCs in opposite directions form a torus. Data movement is explicit, programmed in TT-Metalium. Wormhole n150: 72 Tensix cores, 108 MB of SRAM, 12 GB of GDDR6 at 288 GB/s.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-accel-x2-10','accel','accel-x2','Name four memory design points among 2023-2025 AI chips, with an example of each.','(1) HBM-centric GPUs and TPUs: large HBM, caches and SRAM in the hundreds of MB (Maia 100: 64 GB HBM2E plus about 500 MB). (2) SRAM-only, scaled out across chips: Groq (230 MB per chip), Cerebras (44 GB per wafer). (3) Big SRAM plus cheap LPDDR for recommendation inference: MTIA. (4) Tiered SRAM/HBM/DDR for many models: SN40L. The choice follows the workload''s bytes per FLOP and its capacity needs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g2-01-ml','gpu','gpu-g2','A100 ridge point for dense BF16?','A100 SXM 80 GB: 312 TFLOP/s dense BF16 and about 2.0 TB/s of HBM2e, so the ridge is about 153 FLOP/B. A kernel needs more than about 153 FLOPs per DRAM byte to be compute-bound. (H100 SXM is about 295.)','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g2-02-ml','gpu','gpu-g2','Arithmetic intensity of elementwise kernels, and the fix?','ReLU in BF16 reads 2 B and writes 2 B for 1 op: 0.25 FLOP/B. c = a + b moves 6 B per FLOP: about 0.17 FLOP/B. Both are hopelessly memory-bound on any accelerator. Fix: fuse them into the producer GEMM''s epilogue (or into the consumer), so the tensor never makes an extra round-trip through DRAM.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g2-03-ml','gpu','gpu-g2','Intensity of an M x K by K x N GEMM, and what M does to it.','Intensity = 2MNK / (b(MK + KN + MN)). In BF16 with K = N = 4096: M = 1 (GEMV) gives about 1 FLOP/B; M = 256 gives 256*4096/4608, about 228 FLOP/B. Batch size (M) is what makes a weight-dominated GEMM compute-bound, which is why decode needs batching.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l1-01','mlsys','mlsys-l1','Why are transformer parameters about 12*L*d^2?','Per layer: attention Wq, Wk, Wv, Wo = 4d^2; the MLP with a 4d hidden size is 2 * 4d^2 = 8d^2 (SwiGLU with a hidden size of 8d/3 and 3 matrices also gives 8d^2). Total 12d^2 per layer; this ignores embeddings, norms and biases, and with GQA the K/V matrices are smaller. Check with GPT-3: 12 * 96 * 12288^2 = about 1.74e11, about 175B.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l1-02','mlsys','mlsys-l1','FLOPs per token for inference and training?','Forward pass: about 2P FLOPs per token (one multiply-add per parameter). Backward is about 2x forward, so training is about 6P per token, and total training compute is C = 6ND (N params, D tokens). Attention adds a context-length term on top (next card).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l1-03','mlsys','mlsys-l1','At what context length do attention FLOPs equal the dense-layer FLOPs?','Per token per layer, QK^T and AV cost about 4*n*d FLOPs (n = context length); the dense layers cost about 2*12d^2 = 24d^2. They are equal at n = 6d: about 24.6K tokens for d = 4096. Below that, the matmuls with weights dominate the compute.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l1-04','mlsys','mlsys-l1','What does Multi-head Latent Attention (MLA) cache?','DeepSeek-V2 caches one compressed latent c_KV (d_c = 512) plus one shared decoupled RoPE key (64 dims) per token per layer: 576 elements. MHA with 128 heads x 128 dims would cache 2 * 128 * 128 = 32,768. This is the same cache as GQA with 2.25 groups. At inference the K/V up-projections are folded into the query and output projections, so K and V are never materialized.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l1-05','mlsys','mlsys-l1','Sliding-window attention: what does it do to the KV cache?','Each token attends only to the last W tokens, so each layer keeps a rolling buffer of W entries and the KV cache stops growing with sequence length. Information still travels further through the depth: Mistral 7B (W = 4096, 32 layers) has a theoretical span of about 131K tokens.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l1-06','mlsys','mlsys-l1','Mixtral 8x7B: total vs active parameters, and why it is not 2/8?','8 experts, top-2 routing per token: 46.7B parameters in total, 12.9B active per token. It is not 2/8 of the total because attention, embeddings and norms are shared, and only the FFN is replicated per expert. All 46.7B must still sit in memory, so it has the capacity cost of a 47B model and roughly the compute cost of a 13B one.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l1-07','mlsys','mlsys-l1','How do MoE models keep experts balanced?','A router computes softmax gate scores and picks the top-k experts. An auxiliary load-balancing loss (Switch: alpha * N * sum_i f_i * P_i, with f the fraction of tokens and P the mean router probability per expert) pushes toward uniform use. A capacity factor caps the tokens per expert; overflow tokens are dropped and pass through the residual connection.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l1-08','mlsys','mlsys-l1','Chinchilla rule of thumb?','Compute-optimal training uses about 20 tokens per parameter. Together with C = 6ND: N = sqrt(C/120). Chinchilla itself was 70B parameters on 1.4T tokens. Modern models are often trained far past this point, because a smaller model is cheaper to serve.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l2-01','mlsys','mlsys-l2','TTFT vs TPOT: what sets each one?','Time to first token is mostly prefill: compute-bound and growing with prompt length (plus queueing). Time per output token (inter-token latency) is decode: memory-bound, set by the weight and KV bytes read per step divided by bandwidth. Larger batches raise throughput but stretch TPOT. "Goodput" means requests per second that meet both SLOs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l2-02','mlsys','mlsys-l2','What is chunked prefill?','A long prompt is split into fixed-size chunks. Each iteration batches one prefill chunk with the ongoing decode tokens, up to a token budget. Decodes are no longer stalled behind a long prefill, inter-token latency stays bounded, and the matrix units stay busy because decode work piggybacks on the compute-heavy chunk (Sarathi-Serve).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l2-03','mlsys','mlsys-l2','Prefix caching / RadixAttention?','The KV blocks of shared prefixes (system prompt, few-shot examples, earlier chat turns) are kept and reused, so those tokens skip prefill. SGLang stores them in a radix tree keyed by token sequence with LRU eviction; vLLM hashes full KV blocks. It mostly cuts TTFT and prefill compute.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l2-04','mlsys','mlsys-l2','PagedAttention numbers and copy-on-write.','The KV cache lives in fixed-size blocks (for example 16 tokens), with a per-sequence block table like a page table. The vLLM paper reports that earlier systems wasted 60-80% of KV memory to fragmentation and over-reservation, while vLLM wastes under 4%, giving 2-4x throughput. Blocks are reference-counted, so parallel sampling and beam search share the prompt KV copy-on-write.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l2-05','mlsys','mlsys-l2','Speculative decoding: expected tokens per target-model pass?','With per-token acceptance rate alpha and gamma draft tokens: E = (1 - alpha^(gamma+1)) / (1 - alpha). With alpha = 0.8 and gamma = 4: (1 - 0.32768)/0.2 = 3.36 tokens per pass. Verifying gamma + 1 positions costs about the same as one decode step because decode is memory-bound, so the speedup is about E divided by (1 + draft cost).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l2-06','mlsys','mlsys-l2','KV-cache quantization: what is special about keys vs values?','FP8 or INT8 KV halves the cache size and the decode KV bandwidth; 2-4 bit KV cuts it further. Key activations have a few outlier channels, so KIVI quantizes keys per-channel and values per-token, and keeps a small window of recent tokens in full precision.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l2-07','mlsys','mlsys-l2','Ring all-reduce cost?','Reduce-scatter followed by all-gather. Each of N GPUs sends and receives 2(N-1)/N * S bytes, so time is about 2(N-1)/N * S / link_BW plus latency, nearly independent of N. Example: 8 GPUs, 1 GB of gradients, 100 GB/s: 1.75 GB / 100 GB/s = 17.5 ms.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l2-08','mlsys','mlsys-l2','ZeRO stages and the 16-bytes-per-parameter rule.','Mixed-precision Adam keeps 2 B FP16 weights + 2 B gradients + 12 B optimizer state (FP32 master copy, m, v) = 16 B per parameter. A 7.5B model needs 120 GB before activations. ZeRO-1 shards the optimizer states, ZeRO-2 also the gradients, ZeRO-3 (FSDP) also the parameters, which gives about 16P/N per GPU; ZeRO-3 costs about 1.5x the data-parallel communication volume.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l2-09','mlsys','mlsys-l2','Pipeline bubble with p stages and m microbatches?','Each stage idles for (p-1) slots out of (m + p - 1), so the idle fraction is (p-1)/(m+p-1); Narayanan et al. quote it as bubble/ideal = (p-1)/m. With p = 4 and m = 12: 20% of the time idle (25% relative to ideal). Fixes: more microbatches, or an interleaved schedule with v model chunks per GPU, which divides the bubble by v at the cost of more communication.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l2-10','mlsys','mlsys-l2','Sequence parallelism vs context parallelism?','Megatron sequence parallelism splits the LayerNorm and dropout activations along the sequence inside tensor-parallel regions (each all-reduce becomes a reduce-scatter plus an all-gather), which saves activation memory. Context parallelism (ring attention) splits a long sequence across GPUs and passes K/V blocks around a ring, overlapping the transfers with blockwise attention.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l3-01','mlsys','mlsys-l3','KV-cache drill: Llama 2 7B (32 layers, 32 heads x 128, MHA, BF16).','Per token: 2 * 32 * 32 * 128 * 2 B = 524,288 B = 512 KiB. A 4,096-token sequence: 2 GiB. Batch 16: 32 GiB, more than the 13.5 GB of weights. This is why later models moved to GQA.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l3-02','mlsys','mlsys-l3','KV-cache drill: Llama 3 8B (32 layers, 8 KV heads x 128, GQA, BF16).','Per token: 2 * 32 * 8 * 128 * 2 B = 131,072 B = 128 KiB (4x smaller than Llama 2 7B). An 8K sequence: 1 GiB. A 128K sequence: 16 GiB, which matches the 16 GB of weights.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l3-03','mlsys','mlsys-l3','Training-time drill: 7B parameters on 2T tokens with 1,000 H100s at 40% MFU.','C = 6ND = 6 * 7e9 * 2e12 = 8.4e22 FLOPs. Throughput = 1000 * 989e12 * 0.4 = about 3.96e17 FLOP/s. Time = about 2.1e5 s, about 59 hours, about 2.5 days.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l3-04','mlsys','mlsys-l3','Training-memory drill: a 7B model with Adam in mixed precision.','16 B/param * 7e9 = 112 GB of weights, gradients and optimizer state before activations, so it does not fit on one 80 GB GPU. With ZeRO-3 across 8 GPUs that is 14 GB each, plus activations (reduced with activation checkpointing).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l3-05','mlsys','mlsys-l3','Weight-memory drill: 70B parameters in BF16, FP8, INT4 and NVFP4.','BF16: 140 GB. FP8/INT8: 70 GB. INT4 (ignoring scales): 35 GB. NVFP4 at 4.5 bits: 70e9 * 4.5 / 8 = about 39.4 GB. Add the KV cache and runtime workspace on top.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l3-06','mlsys','mlsys-l3','Batch-1 decode bound for an 8B model on 3.35 TB/s.','Every step reads all the weights. BF16: 16 GB / 3.35 TB/s = about 4.8 ms, so at most about 209 tokens/s. INT4 weights (4 GB): at most about 837 tokens/s. Ignores KV reads and kernel overhead, so real numbers are lower.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-mlsys-l3-07','mlsys','mlsys-l3','Arithmetic intensity of decode attention with GQA?','Each K/V element (2 B in BF16) is read once per step and used by the g query heads that share it, each doing a multiply-add (2 FLOPs). That is about g FLOP/B: about 1 for MHA, about 8 for 8:1 GQA. This is far below any ridge point, and batching does not help because each sequence has its own KV. That is why decode attention is a PIM target.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g4-01','gpu','gpu-g4','FlashAttention IO complexity and block sizes?','Standard attention: Theta(N*d + N^2) HBM accesses (it writes S and P). FlashAttention: Theta(N^2 * d^2 / M), where M is the SRAM size, with block sizes Bc = ceil(M/(4d)) and Br = min(Bc, d). For d = 64-128 and M of about 100 KB, d^2/M is far below 1, so HBM traffic drops many-fold even though FLOPs go up slightly (recompute in the backward pass).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g4-02','gpu','gpu-g4','What did FlashAttention-2 change?','(1) Fewer non-matmul FLOPs: it keeps the output unnormalized and rescales once at the end. (2) It also parallelizes over the sequence (query blocks), not only over batch x heads, so long sequences with a small batch still fill the GPU. (3) Within a block it splits work across warps by Q rather than K, which avoids shared-memory reductions. About 2x faster than FA1, reaching 50-73% of A100 peak.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-gpu-g4-03','gpu','gpu-g4','How do causal FlashAttention kernels save work?','Key blocks that lie entirely above the diagonal (future tokens) are skipped. Only diagonal blocks need element-wise masking, so causal attention does about half the FLOPs of full attention.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-01','soc','soc-fw','What does volatile guarantee in C, and what does it not?','Guarantees: every read and write in the source is performed, none are cached in registers, merged or removed, and they stay in program order relative to other volatile accesses. Needed for MMIO registers, variables written by ISRs, and locals across setjmp. It does not give atomicity, CPU or bus ordering (no memory barrier) or cache bypass, so it is not a thread-synchronization tool; use C11 atomics or locks for that.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-02','soc','soc-fw','const volatile, pointer-to-volatile, volatile pointer: what does each mean?','const volatile uint32_t *sr: a read-only status register that hardware changes; software must not write it, and every read must actually happen. volatile uint32_t *p: the pointee is volatile (the usual form for MMIO). uint32_t * volatile p: the pointer variable itself is volatile (e.g., a pointer changed by an ISR).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-03','soc','soc-fw','Register bit idioms: set, clear, toggle, test, and write a field.','Set: r |= (1u << n). Clear: r &= ~(1u << n). Toggle: r ^= (1u << n). Test: (r >> n) & 1u. Write a field: r = (r & ~(MASK << SH)) | ((v & MASK) << SH). Use unsigned constants (1u): shifting a 1 into the sign bit of an int is undefined behavior. A read-modify-write of a register shared with an ISR or hardware needs protection, or hardware set/clear aliases.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-04','soc','soc-fw','Two bit tricks: isolate the lowest set bit, and round up to a power of two.','x & -x keeps only the lowest set bit; x & (x - 1) clears it (so x && !(x & (x - 1)) tests for a power of two, and a loop of x &= x - 1 counts set bits in popcount iterations). Round up a 32-bit v: v--; v |= v>>1; v |= v>>2; v |= v>>4; v |= v>>8; v |= v>>16; v++.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-05','soc','soc-fw','Endianness: byte layout, detection, swapping.','0x12345678 stored at 0x100: little-endian bytes are 78 56 34 12; big-endian 12 34 56 78. Detect: uint32_t x = 1; *(uint8_t *)&x == 1 means little-endian. Network byte order is big-endian (htonl/ntohl). Swap with __builtin_bswap32 or shifts and masks. Arm, RISC-V and x86 normally run little-endian. It matters for wire formats, DMA descriptors written for a device and cross-platform files.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-06','soc','soc-fw','Struct padding drill: struct { char a; int b; short c; } on a typical 32-bit ABI?','a at offset 0, 3 bytes of padding, b at 4, c at 8, then 2 bytes of tail padding: sizeof = 12. Ordered largest first (int, short, char) it is 8. Do not overlay structs on register maps or wire formats without fixed-width types, explicit packing and static_assert on offsetof; bit-field layout is implementation-defined.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-07','soc','soc-fw','Rules for writing an ISR.','Keep it short; never block (no mutex take, malloc, printf or long loops). Clear or acknowledge the interrupt source, or it fires again at once; on some buses read the register back so the write lands before exception return. Hand the work to a task or bottom half (queue, semaphore give, flag). Shared data must be volatile and protected (disable IRQs, atomics, or a single-writer design). Use only reentrant, ISR-safe APIs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-08','soc','soc-fw','What happens on Cortex-M exception entry?','Hardware pushes 8 words (R0-R3, R12, LR, PC, xPSR) so the ISR can be an ordinary C function. LR gets an EXC_RETURN value, and the vector is fetched from the vector table. Entry latency is about 12 cycles on M3/M4 with zero-wait-state memory. Tail-chaining runs back-to-back pending ISRs without unstacking. In the NVIC a lower priority number means higher urgency.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-09','soc','soc-fw','Torn reads and lost updates between main and an ISR?','A 32-bit counter updated by an ISR on an 8- or 16-bit MCU (or a 64-bit counter on a 32-bit MCU) is read in several pieces, so main can see half old, half new. A read-modify-write of a shared register or flag in main can overwrite an ISR''s update. Fixes: briefly disable interrupts around the access, use atomic instructions (LDREX/STREX, C11 atomics), or a single-writer design.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-10','soc','soc-fw','Lock-free single-producer, single-consumer ring buffer (ISR to task).','The producer writes only head and the consumer only tail. Use a power-of-two size so the index is i & (N-1). Leave one slot empty to tell full from empty (or use free-running counters). Order matters: write the data, then publish head (with a barrier on multicore or weakly ordered memory). The consumer reads head, reads the data, then advances tail. No locks are needed because each index has a single writer.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-11','soc','soc-fw','Mars Pathfinder (1997): what went wrong and how was it fixed?','On VxWorks, a low-priority meteorological task held the mutex on a shared bus information pipe. Medium-priority tasks preempted it, so the high-priority bus-distribution task waited past its deadline, and a watchdog reset the system again and again. The fix, uploaded to the spacecraft, turned on priority inheritance for that mutex. Lessons: use inheritance or ceiling mutexes, and keep debug tracing in flight software.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-12','soc','soc-fw','Rate-monotonic scheduling and the Liu-Layland bound.','Fixed priorities, shortest period first. n tasks are guaranteed schedulable if U = sum(C_i/T_i) <= n(2^(1/n) - 1): 0.828 for n = 2, 0.780 for n = 3, approaching ln 2 (0.693). The bound is sufficient, not necessary: above it, run response-time analysis. EDF (dynamic priority) schedules anything with U <= 1.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-13','soc','soc-fw','In an RTOS, how should an ISR wake a task, and why not with a mutex?','Give a binary or counting semaphore, post to a queue, or send a direct task notification using the FromISR API, then request a context switch on exit if a higher-priority task became ready. A mutex has an owner and priority inheritance and must be released by the task that took it, so it makes no sense in an ISR, which cannot block or own a mutex.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-14','soc','soc-fw','Cache maintenance for DMA on a non-coherent SoC.','TX (device reads memory): clean (write back) the buffer''s cache lines before starting the DMA. RX (device writes memory): invalidate the lines before the CPU reads, and do not touch the buffer while the DMA runs. Align buffers to cache lines and pad them to whole lines, or an invalidate destroys a neighbor''s data. In Linux: dma_map_single plus dma_sync_single_for_cpu/for_device, or coherent (uncached) allocations for descriptor rings.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-15','soc','soc-fw','Compiler barrier vs CPU memory barrier; DMB, DSB, ISB.','A compiler barrier (asm volatile("" ::: "memory")) only stops the compiler from reordering. CPU barriers order the hardware: on Arm, DMB orders memory accesses, DSB waits until they complete, and ISB flushes the pipeline (after changing system registers or code). Doorbell pattern: write the descriptor, then dma_wmb()/wmb(), then write the doorbell. Linux writel() includes the ordering; writel_relaxed() does not.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-16','soc','soc-fw','What does bare-metal startup code do before main()?','At reset (on Cortex-M the vector table supplies the initial SP and the reset handler): set up the stack and clocks, copy .data initial values from flash (LMA) to RAM (VMA), zero .bss, enable the FPU or caches if used, run C++ static constructors (and SystemInit), then call main(). main must never return, or the code must trap if it does.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-17','soc','soc-fw','What goes into an embedded linker script?','MEMORY defines the regions (FLASH rx, RAM rwx) with origins and lengths. SECTIONS: KEEP(*(.isr_vector)) at the start of flash; .text and .rodata in flash; .data with VMA in RAM and LMA in flash (> RAM AT> FLASH); .bss (NOLOAD) in RAM; heap and stack. It exports symbols (_sidata, _sdata, _edata, _sbss, _ebss, _estack) that the startup code uses.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-18','soc','soc-fw','How should firmware use a watchdog?','A hardware timer resets the chip unless it is serviced periodically. Service it from one place that proves the whole system is healthy (for example the main loop after checking each task''s heartbeat), never blindly from a timer ISR, which keeps running while tasks are deadlocked. A windowed watchdog also catches kicks that come too early (runaway loops). Log the reset cause at boot.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-19','soc','soc-fw','What makes a good register map for a hardware block?','An ID/version register; control (RW); status (RO); interrupt raw status, enable/mask and W1C status; no read side effects (or clearly documented clear-on-read); reserved bits read 0 and ignore writes; separate SET/CLR aliases where several agents write; 32-bit aligned; doorbells and FIFOs at their own addresses. Generate the RTL, C headers, UVM RAL and docs from one source (SystemRDL or IP-XACT).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-20','soc','soc-fw','Why are interrupt status bits usually write-1-to-clear?','Software writes 1 only to the bits it has handled; writing 0 leaves the others unchanged. With read-modify-write (or write-0-to-clear) there is a race: hardware can set a new bit between the read and the write, and software would clear it unseen, losing an interrupt. W1C needs no read and no lock.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-21','soc','soc-fw','How do you decide what goes in hardware vs software?','Profile first. Offload a kernel only if its time fraction times its speedup survives Amdahl and the offload overhead (descriptor setup, DMA, cache maintenance, interrupt) is amortized over enough work. Regular, data-parallel, stable math goes in hardware; control, rare paths and fast-changing algorithms stay in software. Freeze the interface (registers, descriptors, error reporting) early and model it before RTL.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-22','soc','soc-fw','JTAG: signals, TAP controller, and what it is used for.','IEEE 1149.1: TCK, TMS, TDI, TDO (TRST optional). TMS, sampled on TCK, walks a 16-state TAP controller. The instruction register selects a data register (BYPASS, IDCODE, boundary scan, or debug access). Uses: board interconnect test (boundary scan), flashing, and on-chip debug through Arm CoreSight. SWD is Arm''s 2-pin alternative (SWDIO, SWCLK).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-23','soc','soc-fw','Debugging a hung or faulted MCU with a JTAG/SWD probe.','Halt and read PC, LR and SP: is the code stuck polling a status bit (peripheral clock or reset not enabled?) or in the HardFault handler? On Cortex-M read CFSR, HFSR and MMFAR/BFAR and unwind the stacked frame to the faulting PC. Use hardware breakpoints and data watchpoints on a corrupted variable, inspect peripheral registers live, and use ITM/ETM trace for timing bugs.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-soc-fw-24','soc','soc-fw','UART vs SPI vs I2C in one card.','UART: asynchronous point-to-point with start and stop bits; 115200 8N1 sends 10 bits per byte, so 11,520 B/s. SPI: synchronous 4-wire (SCLK, MOSI, MISO, CS per device), full-duplex, modes 0-3 set by CPOL/CPHA, tens of MHz. I2C: 2-wire open-drain (SDA, SCL) with pull-ups, 7-bit addresses, ACK/NACK, 100 k/400 k/1 MHz, many devices on one bus, slower.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-01','rtl','rtl-m1','Blocking (=) vs nonblocking (<=): when does each update?','Blocking updates the variable immediately, in the active region. Nonblocking evaluates the right-hand side now and updates in the NBA region, after every active event at that time step. Rule: <= in always_ff, = in always_comb, never mix them in one block, never drive one variable from two blocks.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-02','rtl','rtl-m1','always @(posedge clk) begin b = a; c = b; end: what hardware?','b and c both load a on the same edge: two parallel copies of one stage, not a 2-stage shift register (and b may be optimized away). Written with <= it becomes a -> b -> c, a real shift register.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-03','rtl','rtl-m1','Three common ways to infer a latch by accident.','1) if without else in combinational logic; 2) case without default (or not all values covered); 3) a variable assigned on some paths but not others. Fix: assign defaults at the top of always_comb, add default branches; always_comb makes the tool warn.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-04','rtl','rtl-m1','Name four causes of synthesis-simulation mismatch.','Incomplete sensitivity list (always @(a) that also reads b); initial blocks and #delays (ignored by synthesis); full_case/parallel_case pragmas that change logic without changing simulation; casex/X handling (X-optimism in if/case). Fix: always_comb or @*, unique/priority case, no pragmas.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-05','rtl','rtl-m1','Synchronous vs asynchronous reset: trade-offs.','Sync: reset is just data into D, needs a running clock, filters glitches, is a normal timed path. Async: uses the flop reset pin, works with no clock, resets immediately, but its deassertion must be synchronized (recovery/removal checks) and glitches on the reset net reset the flop.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-06','rtl','rtl-m1','Which registers should get a reset?','Control state: FSM state, valid bits, counters, pointers, anything whose garbage value causes wrong behavior. Pure datapath registers usually need none (qualified by a valid bit): this saves area and reset routing and lets FPGAs infer SRL/DSP registers.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-07','rtl','rtl-m1','Moore vs Mealy FSM.','Moore: outputs depend only on the state, so they change one cycle after the input and are glitch-free if decoded from flops. Mealy: outputs depend on state and inputs, so they react in the same cycle with fewer states, but create an input-to-output combinational path that can glitch.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-08','rtl','rtl-m1','Binary vs one-hot vs Gray state encoding.','Binary: ceil(log2 N) flops, more next-state/output decode logic. One-hot: N flops, each next-state bit is a small OR of incoming transitions: fast, easy timing, the FPGA default. Gray: one bit changes per sequential transition, so less switching power (useful for counter-like FSMs).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-09','rtl','rtl-m1','How do you get registered (glitch-free) FSM outputs without adding a cycle of latency?','Decode the outputs from next_state and register them alongside the state (out_q <= f(next_state)). The output then changes on the same edge the state enters, with no combinational logic after the flop.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-10','rtl','rtl-m1','Rising, falling and any-edge detector equations.','Register the input once (d_q). rise = d & ~d_q, fall = ~d & d_q, any = d ^ d_q. The output is a one-cycle pulse. If d comes from another clock domain, run it through a 2-flop synchronizer first and detect on the synchronized signal.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-11','rtl','rtl-m1','How do you divide a clock by 3 with a 50% duty cycle?','A mod-3 counter on posedge gives an output high for 1 of 3 cycles (33%). Delay that output by half a cycle with a negedge flop and OR the two: high for 1.5 cycles, low for 1.5. It needs a 50% duty input clock; in a real chip use a PLL/clock divider cell and create_generated_clock.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-12','rtl','rtl-m1','Clock enable vs gated clock in RTL.','Write if (en) q <= d; on the main clock: one clock, a recirculating mux (or an enable flop). Never gate a clock with an AND in RTL (glitches, skew). For power, synthesis can convert enables to latch-based integrated clock-gating (ICG) cells automatically.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-13','rtl','rtl-m1','Why does an ICG use a latch before the AND gate?','The latch is transparent while the clock is low and holds the enable while it is high, so an enable change can never cut or create a pulse during the high phase. A plain AND of clk and en glitches whenever en changes while clk is high.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-14','rtl','rtl-m1','RTL low-power techniques besides clock gating.','Operand isolation (hold datapath inputs steady when the result is unused), data gating of wide buses, memory chip-enable gating, fewer toggles (Gray counters, bus-invert coding), multi-Vt/multi-voltage domains, and power gating with isolation and retention cells (described in UPF).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m1-15','rtl','rtl-m1','casez vs casex vs case inside.','casez treats z/? as don''t-care; casex also treats X as don''t-care, so an X on the selector in simulation can match a branch silently (sim/synth mismatch). Prefer casez or SystemVerilog case inside with ? wildcards.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-01','rtl','rtl-m2','How does a synchronous FIFO tell full from empty with pointers alone?','Use N+1-bit pointers for a 2^N-deep FIFO. Empty: pointers equal. Full: MSBs differ and the lower N bits are equal (the writer is exactly one lap ahead). Alternative: keep an occupancy counter.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-02','rtl','rtl-m2','FIFO depth for one burst: formula.','Depth >= B - (words read during the burst) = B - B x (read rate / write rate). Rates include idle cycles (read every 2nd cycle halves the rate). For an async FIFO add a few entries for pointer synchronization latency.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-03','rtl','rtl-m2','Standard vs first-word-fall-through (FWFT) FIFO.','Standard: read data appears the cycle after rd_en. FWFT (show-ahead): the head word is already on the output whenever !empty, and rd_en acts as an acknowledge. FWFT saves a cycle but adds an output register/mux stage to keep timing.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-04','rtl','rtl-m2','The valid/ready (AXI) handshake rules.','A transfer happens on a clock edge where valid && ready. The source must not wait for ready before asserting valid. Once valid is high, valid and data stay stable until accepted. The sink may wait for valid before asserting ready. Never make valid depend combinationally on ready.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-05','rtl','rtl-m2','Why use a skid buffer?','It registers ready so the backpressure path is not one long combinational chain through every stage. Because the upstream sees the registered ready one cycle late, one extra word can arrive; a second register (the skid) catches it. Two entries keep full throughput.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-06','rtl','rtl-m2','Global stall vs per-stage ready in a pipeline.','Global stall: one stall signal fans out to every stage (big fanout path, bubbles never collapse). Per-stage: stage i can accept when it is empty or its contents move on: ready_i = !valid_i || ready_(i+1). That ready chain is combinational end to end unless skid buffers break it.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-07','rtl','rtl-m2','One-line fixed-priority arbiter (lowest index wins).','grant = req & (~req + 1), i.e. req & -req: two''s complement isolates the lowest set bit. Simple and fast (carry chain), but low-priority requesters can starve.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-08','rtl','rtl-m2','How does a mask-based round-robin arbiter work?','Keep the last grant. Mask off requests at and below it; if any masked request remains, grant the lowest of those, otherwise grant the lowest unmasked request. Two fixed-priority arbiters plus a mux. Each requester waits at most N-1 grants.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-09','rtl','rtl-m2','Credit-based flow control.','The sender starts with credits = receiver buffer entries, spends one per word and gets one back when the receiver frees an entry. Full throughput needs credits >= round-trip latency (cycles) x words per cycle. Used in NoCs and PCIe; no combinational ready path across the link.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-10','rtl','rtl-m2','Ping-pong (double) buffer.','Two banks: the producer fills one while the consumer drains the other, then they swap. Hides load latency behind compute (accelerator weight and activation buffers). Costs 2x storage; the swap is a handshake on both sides being done.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m2-11','rtl','rtl-m2','Read-during-write on a register file or RAM.','Same-cycle read of an address being written returns old data (read-first), new data (write-first) or undefined, depending on the RAM. If the pipeline needs the new value, add a bypass mux comparing addresses (like register-file forwarding).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-01','rtl','rtl-m3','What is metastability?','If data changes inside a flop''s setup/hold window, the flop can sit between 0 and 1 for an unbounded time before resolving to a random value. The chance it is still unresolved after time t falls as e^(-t/tau), tau being a technology constant (tens of ps in modern nodes).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-02','rtl','rtl-m3','Synchronizer MTBF formula.','MTBF = e^(t_r / tau) / (T0 x f_clk x f_data). t_r = resolution time available (about one clock period minus t_cq and t_su per extra stage), tau and T0 are flop constants. Each extra synchronizer stage adds about one clock period to t_r, multiplying MTBF by about e^(T_clk/tau).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-03','rtl','rtl-m3','The 3 CDC methods and when to use each.','1) Two-flop synchronizer: single-bit level signals. 2) Req/ack handshake (or MCP formulation): multi-bit data or pulses at low rate, data held stable while a synchronized control crosses. 3) Async FIFO with Gray-coded pointers: streaming multi-bit data at full rate.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-04','rtl','rtl-m3','Rules for a two-flop synchronizer.','Source signal comes straight from a flop (no combinational logic, which can glitch); it must stay stable for at least ~1.5 destination clock periods (the three-edge rule) to be seen; no logic between the two flops; place them close (ASYNC_REG on FPGAs).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-05','rtl','rtl-m3','Why must there be no combinational logic right before a synchronizer?','Combinational outputs glitch while their inputs settle; the destination clock is unrelated, so it can sample a glitch as a real pulse. Register the signal in the source domain first.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-06','rtl','rtl-m3','How do you pass a single-cycle pulse from a fast to a slow clock?','A plain 2-flop sync can miss it. Options: stretch it in the source domain (>= 1.5 destination periods), use a toggle synchronizer (pulse flips a toggle flop, sync it, XOR edge-detect in the destination), or a req/ack handshake if pulses can come back to back.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-07','rtl','rtl-m3','Limit of a toggle (pulse) synchronizer.','Pulses must be spaced by at least ~2-3 destination cycles; two toggles inside one destination sampling window cancel and a pulse is lost. There is no backpressure, so use a handshake when spacing is not guaranteed.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-08','rtl','rtl-m3','How does a 4-phase req/ack handshake move a multi-bit value?','Source puts data on a bus and holds it, raises req. Destination syncs req (2 flops), captures the bus (stable, so no per-bit sync), raises ack. Source syncs ack, drops req; destination drops ack. Only req and ack cross through synchronizers.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-09','rtl','rtl-m3','2-phase vs 4-phase handshake.','4-phase (return to zero): req up, ack up, req down, ack down: two round trips per transfer, simple level logic. 2-phase (toggle): every req toggle is a new transfer, ack toggles back: one round trip, about twice the throughput, needs XOR edge detection.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-10','rtl','rtl-m3','Why not synchronize each bit of a binary bus with its own 2-flop synchronizer?','Bits that change together can resolve in different destination cycles, so the destination can see a value that never existed (0111 -> 1000 seen as 1111 or 0000). Only safe if at most one bit changes per transfer (Gray-coded counters) or the bus is quasi-static and qualified.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-11','rtl','rtl-m3','What is a reconvergence problem in CDC?','Two signals synchronized separately and later combined can arrive one cycle apart, so their combination is briefly wrong. Fix: synchronize a single control signal once and fan out after the synchronizer, or Gray-encode related bits.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-12','rtl','rtl-m3','Binary-to-Gray and Gray-to-binary.','gray = bin ^ (bin >> 1). Back: bin[MSB] = gray[MSB], then bin[i] = bin[i+1] ^ gray[i] going down (a prefix XOR from the MSB). Example: 1011 -> 1110; Gray 1101 -> 1001.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-13','rtl','rtl-m3','Async FIFO: empty and full conditions with N+1-bit Gray pointers.','Empty (read domain): read Gray pointer == synchronized write Gray pointer. Full (write domain): write Gray pointer == synchronized read Gray pointer with its top two bits inverted and the rest equal.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-14','rtl','rtl-m3','Why are async FIFO flags pessimistic but safe?','Each side sees the other pointer 2-3 cycles late. So empty can stay asserted a little after data arrives and full can stay asserted a little after space frees: never overflow or underflow, just short stalls.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-15','rtl','rtl-m3','Why does an async FIFO usually need a power-of-2 depth?','The Gray-code wraparound must also change only one bit; a standard reflected Gray counter does that only at 2^N. Other depths need special Gray sequences or a different scheme.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-16','rtl','rtl-m3','Reset synchronizer: structure and why.','Two flops with async reset, D of the first tied to 1, output used as the domain reset. Reset asserts immediately (async) and deasserts on a clock edge (sync), so all flops leave reset in the same cycle and recovery/removal is met. One per clock domain.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-17','rtl','rtl-m3','How does a glitch-free clock mux work?','Each clock has an enable path of flops (the last on the falling edge) with cross-coupled feedback: a clock''s enable can rise only after the other''s has fallen. Enables change while their clock is low, so no runt pulses. Both clocks must be running during a switch.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-18','rtl','rtl-m3','How are CDC paths constrained in STA?','Declare unrelated clocks asynchronous (set_clock_groups -asynchronous) or false-path the crossing; for Gray-pointer and handshake buses use set_max_delay -datapath_only (about one destination period) so the bits do not skew apart by more than a cycle.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m3-19','rtl','rtl-m3','How is CDC verified?','Structural CDC tools (Spyglass CDC, Questa CDC) find unsynchronized crossings, glitch-prone logic and reconvergence. Normal simulation cannot show metastability, so add metastability injection (random extra cycle of delay in synchronizers) and assertions on handshake protocols.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-01','rtl','rtl-m4','fmax of a register-to-register path.','fmax = 1 / (t_cq + t_logic,max + t_su - skew + t_uncertainty), skew = capture clock arrival - launch clock arrival. On FPGAs routing delay is part of the path delay and often as large as the logic.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-02','rtl','rtl-m4','Clock skew vs clock jitter.','Skew is spatial: the same edge reaches different flops at different times (static, set by the clock tree). Jitter is temporal: an edge moves from cycle to cycle. STA lumps jitter and margin into clock uncertainty.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-03','rtl','rtl-m4','How does jitter enter setup vs hold checks?','Setup compares two consecutive edges, so cycle-to-cycle jitter shrinks the usable period. Hold compares launch and capture on the same edge, so period jitter mostly cancels; the hold uncertainty mainly covers skew margin.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-04','rtl','rtl-m4','Setup check vs hold check: which edges?','Setup: data launched at edge 0 must arrive before the capture edge at T (minus t_su). Hold: data launched at edge 0 must not reach the capture flop before the hold window of the same edge 0 closes, or it corrupts the value being captured.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-05','rtl','rtl-m4','Why is a hold violation worse than a setup violation?','Hold does not depend on the clock period, so the chip fails at every frequency and slowing the clock cannot save silicon. A setup violation only limits fmax: the part still works at a lower clock.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-06','rtl','rtl-m4','Can a shift register with zero logic between flops violate hold?','Yes, if clock skew is larger than t_cq - t_hold (capture clock late). That is why CTS balances skew and why tools insert hold buffers on short paths after CTS.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-07','rtl','rtl-m4','Multicycle path: what and how in SDC?','A path whose result is needed only every N cycles (enable-qualified). set_multicycle_path N -setup moves the capture edge N cycles out; the hold check then moves too, so add set_multicycle_path N-1 -hold to put hold back on the original edge.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-08','rtl','rtl-m4','False path: examples and risk.','Paths that can never be exercised functionally or must not be timed: between asynchronous clock domains (through synchronizers), static configuration registers, test-mode muxes. Risk: a wrong false path hides a real failing path, so keep them narrow and reviewed.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-09','rtl','rtl-m4','Pipelining vs retiming.','Pipelining adds register stages: shorter cycle, more latency, higher throughput. Retiming moves existing registers across combinational logic to balance stage delays without changing function or I/O latency. Tools can retime; you must pipeline.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-10','rtl','rtl-m4','RTL fixes for a path that fails setup.','Pipeline or retime; duplicate high-fanout registers; use one-hot instead of encoded decode; move the late-arriving signal to the last logic level; precompute or compute both outcomes and select (Shannon expansion, carry-select); use carry chains/DSPs; narrow wide muxes.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-11','rtl','rtl-m4','Late-arriving signal: how to restructure the logic?','Push the late signal as close to the output as possible: compute y for both values of the late signal in parallel, then let the late signal drive only the final 2:1 mux (Shannon expansion). Costs area, saves logic levels on the critical input.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-12','rtl','rtl-m4','Time borrowing with latches.','A latch is transparent for half the cycle, so data that arrives late at a latch passes through and borrows time from the next stage (up to about the transparent phase minus setup). Flip-flops cannot borrow: each stage must fit in one period.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-13','rtl','rtl-m4','On-chip variation (OCV) derates in setup analysis.','For setup, STA makes the launch clock and data path late (slow derate) and the capture clock early (fast derate); for hold it does the opposite. AOCV/POCV make the derate depend on path depth/location or statistics to reduce pessimism.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-14','rtl','rtl-m4','What is CRPR (CPPR)?','Clock reconvergence pessimism removal: launch and capture clocks share a common clock-tree segment that cannot be both slow and fast at once, so STA credits back the late-minus-early delay difference of that shared part.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-15','rtl','rtl-m4','Recovery and removal checks.','Timing checks on the deassertion of an asynchronous reset/set relative to the clock: recovery is the setup-like check (deassert early enough before the edge), removal is the hold-like check (not too soon after it). A reset synchronizer makes them easy to meet.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-16','rtl','rtl-m4','Which corners check setup and hold?','Setup at the slow corner (slow-slow process, low voltage, worst-case temperature); hold at the fast corner (fast-fast, high voltage). Advanced nodes show temperature inversion, so both temperature extremes are run.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m4-17','rtl','rtl-m4','Basic SDC commands for a block.','create_clock (period, waveform), create_generated_clock (dividers), set_input_delay / set_output_delay (the off-block part of I/O paths), set_clock_uncertainty, set_false_path, set_multicycle_path, set_clock_groups -asynchronous.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-01','rtl','rtl-m5','Immediate vs concurrent assertions.','Immediate: assert (expr) inside procedural code, checked once when executed, like an if. Concurrent: assert property (@(posedge clk) ...), sampled every clock in the preponed region, can describe sequences over many cycles.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-02','rtl','rtl-m5','|-> vs |=>','Overlapping implication a |-> b checks b in the same cycle a holds; non-overlapping a |=> b checks b one cycle later. a |=> b is the same as a |-> ##1 b. If a is false the property passes vacuously.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-03','rtl','rtl-m5','Write SVA: no push when the FIFO is full.','assert property (@(posedge clk) disable iff (!rst_n) full |-> !push); plus the mirror: empty |-> !pop. disable iff turns the check off during reset.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-04','rtl','rtl-m5','SVA sampled-value functions.','$rose(x) / $fell(x): x changed 0->1 / 1->0 since the last clock; $stable(x): unchanged; $past(x, n): value n clocks ago. Example: valid && !ready |=> valid && $stable(data).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-05','rtl','rtl-m5','Code coverage vs functional coverage.','Code coverage (line, branch, toggle, FSM, expression) is collected automatically and shows what RTL ran. Functional coverage is written by you (covergroups, cover properties) from the spec and shows which features and corner cases were exercised. 100% code coverage does not mean verified.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-06','rtl','rtl-m5','covergroup pieces.','coverpoint (a variable), bins (values or ranges to hit, e.g. {0}, {[1:254]}, {255}), cross (combinations of coverpoints), ignore_bins and illegal_bins, sampled on a clock event or with sample().','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-07','rtl','rtl-m5','UVM testbench components.','sequence_item (transaction), sequence (generates items), sequencer (arbitrates them), driver (items -> pin wiggles), monitor (pins -> items), agent (sequencer + driver + monitor; passive = monitor only), scoreboard (checks), env (agents + scoreboard), test (configures env, starts sequences).','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-08','rtl','rtl-m5','UVM phases in order.','build (top-down, create components), connect (bottom-up, TLM wiring), end_of_elaboration, start_of_simulation, run (the only time-consuming phase; reset/configure/main/shutdown sub-phases), extract, check, report, final. Objections keep run alive until stimulus is done.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-09','rtl','rtl-m5','Why type_id::create() and uvm_config_db?','create() goes through the factory, so a test can override a type (a different driver or a constrained sequence item) without editing the env. uvm_config_db passes virtual interfaces and settings down the hierarchy by path.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-10','rtl','rtl-m5','How does a monitor send transactions to a scoreboard?','Through a uvm_analysis_port: the monitor calls ap.write(tr), which broadcasts to every connected analysis export/imp (scoreboard, coverage collector). Non-blocking, one-to-many.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-11','rtl','rtl-m5','What problem do clocking blocks solve?','Testbench-DUT races at the clock edge. A clocking block samples inputs a skew before the edge and drives outputs a skew after it, so the TB sees the same values the DUT flops see.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO cards(id,track,module,front,back,created_at) VALUES('c2-rtl-m5-12','rtl','rtl-m5','Formal verification vs simulation.','Simulation checks the input sequences you generate; formal proves (or finds a counterexample to) assertions for all inputs within a bound. Formal fits small control-heavy blocks: arbiters, FIFOs, handshakes, CDC protocols. It struggles with deep datapaths.','2026-01-01T00:00:00Z');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a1-01','arch','arch-p3','A 5-stage pipeline resolves branches in EX and predicts not-taken. 20% of instructions are branches and 60% of them are taken. Ignoring other stalls, what is the CPI?','["1.12","1.24","1.40","1.20"]',1,'A taken branch flushes the 2 instructions fetched after it: CPI = 1 + 0.2 x 0.6 x 2 = 1.24.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a1-02','arch','arch-p4','Which structure lets an out-of-order core provide precise exceptions?','["Common data bus","Reservation stations","Branch target buffer","Reorder buffer"]',3,'The ROB retires instructions in program order, so at an exception everything older has committed and everything younger can be flushed.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a1-03','arch','arch-p4','In Tomasulo''s algorithm, how are WAR and WAW hazards eliminated?','["By stalling issue until all older writes complete","Operands are renamed to reservation-station tags, so later writes cannot clobber values earlier instructions are waiting for","By forwarding results from MEM to EX","By executing stores before loads"]',1,'Tags act as renamed registers: a waiting instruction holds either the value or the producing station''s tag, so name dependences disappear.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a1-04','arch','arch-p4','A load executes before an older store whose address was unknown; the store later resolves to the same address. What must the core do?','["Flush the entire cache","Squash and re-execute the load and its dependent instructions","Forward the load''s value to the store","Nothing; the store will overwrite memory later"]',1,'The load read stale data, a memory-ordering violation, so it and everything that used its value must be replayed.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a1-05','arch','arch-p4','What does a branch target buffer (BTB) supply that a direction predictor does not?','["The predicted target address, available at fetch","Whether the branch is taken","The return address for function calls only","The global history register"]',0,'The direction predictor says taken/not-taken; the BTB caches target addresses so fetch can redirect in the same cycle.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a2-01','arch','arch-p5','L1 hit time 1 cycle, L1 miss rate 10%, L2 hit time 10 cycles, L2 local miss rate 20%, memory latency 100 cycles. What is the AMAT?','["3 cycles","4 cycles","11 cycles","5 cycles"]',1,'AMAT = 1 + 0.1 x (10 + 0.2 x 100) = 1 + 0.1 x 30 = 4 cycles.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a2-02','arch','arch-x1','Which DRAM access is slowest?','["Row-buffer conflict","Access to a precharged (closed) bank","Row-buffer hit","A second column read in the same open row"]',0,'A conflict must precharge the open row (tRP), activate the new one (tRCD), then read (tCL).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a2-03','arch','arch-p5','A stride prefetcher issues 1000 prefetches; 600 are later used. Without prefetching there were 2000 misses, now there are 1400. Accuracy and coverage are:','["60% and 30%","30% and 60%","60% and 70%","70% and 30%"]',0,'Accuracy = 600/1000 = 60%. Coverage = (2000 - 1400)/2000 = 30%.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a2-04','arch','arch-p5','Raising associativity while keeping capacity and block size fixed mainly reduces which misses?','["Conflict","Capacity","Coherence","Compulsory"]',0,'More ways per set lets blocks that map to the same set coexist; capacity and first-touch misses are unchanged.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a2-05','arch','arch-p5','With 4 KB pages, which L1 can be VIPT without aliasing?','["64 KB, 4-way","32 KB, 4-way","48 KB, 12-way","16 KB, direct-mapped"]',2,'Size/ways must be <= 4 KB: 48K/12 = 4K works; 64K/4 = 16K, 32K/4 = 8K and 16K/1 = 16K do not.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a3-01','arch','arch-x2','On x86-TSO, which reordering can a program observe without fences?','["Load followed by load","Store followed by store","Store followed by a later load to a different address","Load followed by a later store"]',2,'TSO''s store buffer lets a later load complete before an earlier store becomes visible; that is the only relaxation.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a3-02','arch','arch-x2','A core holds a line in E and writes it. In MESI, what happens?','["It writes through to memory and stays in E","It broadcasts an invalidate and moves to M","It moves to S","It moves to M silently, with no bus transaction"]',3,'E means no other cache has the line, so the core can upgrade to M locally.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a3-03','arch','arch-x2','Why do large many-core chips use directory-based coherence?','["Directories need no extra storage","They remove the need for invalidations","They guarantee sequential consistency","They avoid broadcasting every miss, so coherence traffic scales with the number of sharers instead of the number of cores"]',3,'Point-to-point messages to the actual sharers replace bus-wide broadcasts.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a3-04','arch','arch-x2','Which routing is deadlock-free on a 2D mesh without extra virtual channels?','["Random routing","Fully adaptive minimal routing","Dimension-order (XY) routing","Hot-potato routing"]',2,'XY routing forbids turns from Y back to X, so no cyclic channel dependence can form.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a3-05','arch','arch-x2','Two threads each increment their own counter, and the counters sit in the same 64-byte line. Throughput is poor. The most likely cause is:','["False sharing","TLB thrashing","True sharing","A capacity miss"]',0,'The variables are independent but share a line, so every write invalidates the other core''s copy.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a4-01','arch','arch-x1','Ambit activates rows A, B and a control row C set to all 1s. The bitlines settle to:','["A AND B","A XOR B","NOT A","A OR B"]',3,'Triple-row activation gives MAJ(A,B,C); with C = 1 the majority is A OR B.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a4-02','arch','arch-x1','Which product puts general-purpose programmable cores next to DRAM banks?','["Samsung HBM-PIM","UPMEM PIM","SK hynix AiM","Ambit"]',1,'UPMEM DPUs are in-order RISC cores, one per bank, programmed in C; the others are fixed-function units or in-array logic.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a4-03','arch','arch-x1','Why is ECC alone not a complete RowHammer defense?','["ECC disables refresh","ECC only protects SRAM","Hammering can flip several bits in one word, beyond what SECDED corrects","ECC cannot run at DRAM speed"]',2,'Studies show multi-bit flips per codeword; SECDED corrects one and detects two.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a4-04','arch','arch-x1','Row-buffer hit 15 ns (tCL); tRCD = tRP = 15 ns. A row-conflict access takes:','["15 ns","30 ns","45 ns","60 ns"]',2,'Conflict = tRP + tRCD + tCL = 15 + 15 + 15 = 45 ns.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-arch-a4-05','arch','arch-x1','What does DDR5''s PRAC mechanism add?','["On-die SECDED","A faster refresh rate","Per-row activation counters that let the DRAM tell the controller to back off and refresh victims","Encryption of row addresses"]',2,'PRAC counts activations per row and raises Alert Back-Off so the controller grants time to refresh at-risk rows.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m1-01','mlir','mlir-m1','In MLIR, values that flow into a block from different predecessors are represented by:','["Block arguments","phi operations","Global variables","Attributes"]',0,'MLIR has no phi op; terminators forward values to the successor''s block arguments.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m1-02','mlir','mlir-m1','A pass must fail if any op from the source dialect is left after lowering. Which mechanism fits?','["The inliner","Dialect conversion with a ConversionTarget marking the source dialect illegal","Greedy pattern rewrite driver","The canonicalizer"]',1,'Dialect conversion checks legality and reports failure when illegal ops remain.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m1-03','mlir','mlir-m1','In linalg.generic, what marks a loop dimension as a reduction?','["A memref layout attribute","Its indexing map","The region''s terminator","Its iterator type"]',3,'Each loop dimension carries an iterator type, parallel or reduction.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m1-04','mlir','mlir-m1','Which statement about MLIR attributes is correct?','["They can only be integers","They are runtime SSA values","They replace types","They are compile-time constant data attached to operations"]',3,'Attributes hold constant metadata such as shapes, strides or constant values; SSA operands carry runtime values.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m1-05','mlir','mlir-m1','Which upstream dialect is a fixed, specification-defined set of tensor operators often used as a framework import target?','["memref","TOSA","scf","llvm"]',1,'TOSA defines a stable set of whole-tensor operators; scf, memref and llvm are lower-level dialects.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m2-01','mlir','mlir-m2','What is the main benefit of fusing an elementwise producer into a tiled matmul consumer?','["It removes the reduction loop","It converts tensors to memrefs","Fewer compiler passes","The producer''s result for each tile stays in fast memory instead of being written to and re-read from DRAM"]',3,'Fusion recomputes or computes the producer per tile, removing the full intermediate tensor''s memory traffic.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m2-02','mlir','mlir-m2','One-Shot Bufferization inserts a copy for a tensor write when:','["Writing in place would overwrite a value that is still read later (a RAW conflict)","The op is in destination-passing style","The tensor has a static shape","The tensor is a function argument"]',0,'If an in-place write would clobber data another use still needs, the analysis allocates a new buffer.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m2-03','mlir','mlir-m2','The transform dialect lets a developer:','["Replace LLVM''s register allocator","Define new tensor types","Write new hardware backends in TableGen","Express optimization schedules as IR applied to payload IR"]',3,'Transform scripts drive tiling, fusion, vectorization and so on, separately from the computation.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m2-04','mlir','mlir-m2','In MLIR, %r = linalg.matmul ins(%A, %B) outs(%C) returns a tensor. What is %C?','["A scratch buffer","A tiling parameter","A memref","The destination (init) tensor the result accumulates into"]',3,'Destination-passing style: outs supplies the initial value and the buffer to reuse.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m2-05','mlir','mlir-m2','Which op creates a tensor that has a shape but no defined contents, typically used as a destination before bufferization?','["memref.alloc","tensor.empty","linalg.yield","arith.constant"]',1,'tensor.empty only carries a shape; bufferization turns it into an allocation (or reuses a buffer).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m4-01','mlir','mlir-m4','Which LLVM instruction never reads or writes memory?','["load","atomicrmw","store","getelementptr"]',3,'GEP only computes an address.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m4-02','mlir','mlir-m4','Which pass promotes stack allocas to SSA values and inserts phi nodes?','["GVN","InstCombine","LICM","mem2reg / SROA"]',3,'mem2reg (and SROA, which also splits aggregates) turns allocas used only by loads/stores into SSA registers.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m4-03','mlir','mlir-m4','In SelectionDAG, a target with no 64-bit multiply sees i64 mul. Which step deals with it?','["Register allocation","Type/operation legalization","Scheduling","Instruction combining in the middle end"]',1,'Legalization expands unsupported types or operations into ones the target has.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m4-04','mlir','mlir-m4','Instruction selection patterns in LLVM backends are usually written in:','["MLIR PDL","C only","TableGen (.td) files","YAML"]',2,'TableGen describes registers, instructions and selection patterns; it generates the matcher tables.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m4-05','mlir','mlir-m4','Where does register allocation happen relative to instruction selection?','["In the front end","Before, on LLVM IR","After, on MachineInstrs","During DAG combining"]',2,'Selection produces MachineInstrs with virtual registers; the register allocator assigns physical registers afterwards.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m3-01','mlir','mlir-m3','Which dialect pair is AMD-GPU specific in upstream MLIR?','["amdgpu / rocdl","nvvm / nvgpu","spirv / gpu","tosa / linalg"]',0,'amdgpu exposes AMD-specific ops and rocdl maps to ROCm device intrinsics.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m3-02','mlir','mlir-m3','An exact MIP scheduler times out on large networks. The most standard remedy is:','["Partition the graph or impose a solver time limit and accept a bounded optimality gap","Switch to floating-point weights","Remove dependence constraints","Run the MIP at runtime"]',0,'Decomposition and time-limited solves with known gaps are the usual ways to scale MIP scheduling.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m3-03','mlir','mlir-m3','In a PIM compiler, which decision has no counterpart in a typical GPU kernel compiler?','["Vectorization","Register allocation","Choosing which memory rows/arrays hold each operand so in-memory operations can run in place","Loop tiling"]',2,'In-memory compute only works on data co-located in the right array, so data placement becomes part of compute scheduling.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m3-04','mlir','mlir-m3','Where does a vendor accelerator stack usually do operator fusion?','["In the LLVM backend","In the assembler","At the graph or tensor level, before kernel-level lowering","After register allocation"]',2,'Fusion decisions need tensor-level dataflow, which is lost after lowering to loops and instructions.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m5-01','mlir','mlir-m5','Which description fits MLIR best?','["A framework of reusable dialects and passes for building compilers","A model format like ONNX","An auto-tuner for CUDA kernels","A JAX-only compiler"]',0,'MLIR provides IR infrastructure; XLA, IREE, Triton and torch-mlir are compilers built on it.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m5-02','mlir','mlir-m5','In OpenXLA, which is the portable input dialect that frameworks emit?','["LLVM IR","TensorIR","StableHLO","HLO"]',2,'StableHLO is the versioned, MLIR-based interchange; HLO is XLA''s internal IR.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m5-03','mlir','mlir-m5','What does TVM''s MetaSchedule do?','["Converts ONNX to Relax","Schedules OS threads","Assigns GPU memory","Searches the space of tensor-program schedules using measurements and a cost model"]',3,'It is TVM''s auto-scheduler/tuner over TensorIR transformations.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m5-04','mlir','mlir-m5','Why is fusion so valuable in ML compilers like XLA?','["It removes the need for a runtime","It increases FLOPs","Most non-matmul ops are memory-bound, so keeping intermediates on chip saves HBM traffic","It shrinks the model weights"]',2,'Fusing elementwise chains removes intermediate reads and writes, which dominate their run time.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlir-m5-05','mlir','mlir-m5','In PyTorch 2''s torch.compile, which component generates Triton kernels for GPUs?','["AOTAutograd","TorchInductor","TorchScript","TorchDynamo"]',1,'Dynamo captures graphs and AOTAutograd handles the backward; Inductor is the code generator.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s1-01','soc','soc-extra','On a given clock edge, AWVALID = 1 and AWREADY = 0. What happens?','["The address is transferred","Nothing transfers; the manager must keep AWVALID and the address stable","The manager may drop AWVALID and retry later","The subordinate returns an error"]',1,'Once asserted, VALID must stay high with stable payload until READY is seen.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s1-02','soc','soc-extra','Which AXI channel carries the write response?','["R","W","AR","B"]',3,'B is the write response channel; R carries read data plus its response.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s1-03','soc','soc-extra','Which AXI4 burst is meant for cache-line fills that start at the critical word?','["WRAP","INCR","Exclusive","FIXED"]',0,'WRAP bursts wrap around an aligned boundary, so the fill can begin at the requested word.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s1-04','soc','soc-l4','Which protocol is the right choice for a block of slow configuration registers?','["CHI","AXI4 with 16 outstanding IDs","ACE","APB"]',3,'APB is a simple, low-power, unpipelined bus intended for peripheral register access.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s1-05','soc','soc-extra','Two AXI read requests with different IDs are outstanding. Which statement is true?','["Responses must return in request order","The second request is not allowed until the first completes","The data beats of both responses are always interleaved","Responses may return in either order"]',3,'Ordering is only required among transactions with the same ID.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s4-01','soc','soc-l2','Program A: 10^9 instructions, CPI 1.5, 2 GHz. What is its run time?','["0.5 s","0.75 s","1.33 s","3 s"]',1,'Time = 10^9 x 1.5 / (2 x 10^9) = 0.75 s.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s4-02','soc','soc-l3','In the RISC-V ABI, which register must a function restore before returning if it modified it?','["t6","a0","t0","s1"]',3,'s-registers are callee-saved; t- and a-registers are caller-saved.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s4-03','soc','soc-l3','Which tool resolves references to symbols defined in other object files?','["Assembler","Loader","Linker","Compiler"]',2,'The linker resolves symbols and applies relocations to produce the executable.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s4-04','soc','soc-l3','What does the RISC-V ''C'' extension add?','["Coherence","Cache-control instructions","Cryptography","16-bit compressed encodings of common instructions"]',3,'C adds compressed 16-bit encodings that improve code density.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s4-05','soc','soc-l2','Lowering CPI by 20% while the clock period grows by 25% makes the program:','["About 5% slower","About 5% faster","20% faster","Equally fast"]',3,'0.8 x 1.25 = 1.0, so execution time is unchanged.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s2-01','soc','soc-l5','Why are MMIO device registers mapped uncacheable?','["Caching would increase PCIe bandwidth","MMIO addresses are virtual","Reads and writes have side effects and must reach the device exactly once and in order","Caches are too small"]',2,'Caching could hide, merge or reorder accesses that change device state.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s2-02','soc','soc-extra','Which PCIe transaction needs a completion?','["Memory write","A posted message","MSI-X interrupt","Memory read"]',3,'Reads are non-posted; the completer returns data in completion TLPs.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s2-03','soc','soc-extra','A memory expander that adds DRAM capacity to a server over CXL is which device type?','["Type 2","Type 3","Type 1","Type 0"]',1,'Type 3 devices use CXL.io and CXL.mem to expose memory without caching host memory.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s2-04','soc','soc-extra','Which PCIe layer retransmits a TLP that arrived with a bad LCRC?','["Physical layer","Application layer","Transaction layer","Data link layer"]',3,'The data link layer uses sequence numbers, LCRC and ACK/NAK to replay corrupted TLPs.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s2-05','soc','soc-l5','What makes scatter-gather DMA possible?','["Caching device registers","Polling","A single base and length register","A chain or ring of descriptors, each pointing to the next buffer"]',3,'Linked descriptors let one DMA job cover many non-contiguous buffers.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s3-01','soc','soc-extra','Halving both V and f (alpha and C fixed) reduces dynamic power to:','["1/2","1/4","1/8","1/16"]',2,'P is proportional to V^2 f: (1/2)^2 x (1/2) = 1/8.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s3-02','soc','soc-extra','Which technique mainly reduces leakage power in an idle block?','["Wider buses","Pipelining","Clock gating","Power gating"]',3,'Clock gating stops switching; only cutting the supply removes leakage.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s3-03','soc','soc-extra','A powered-off block drives signals into an active block. What prevents floating inputs?','["Retention registers","Isolation cells","Clock gating","Level shifters"]',1,'Isolation cells clamp the boundary outputs to safe values while the source domain is off.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s3-04','soc','soc-extra','Why does an ICG cell contain a latch?','["To keep the enable stable while the clock is high so the gated clock does not glitch","To store retention state","To divide the clock","To shift voltage levels"]',0,'The latch is transparent only while the clock is low, so enable changes cannot create glitches on the gated clock.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s3-05','soc','soc-extra','Which cell keeps a flip-flop''s state while its domain is power-gated?','["Integrated clock-gating cell","Retention register","Level shifter","Isolation cell"]',1,'A retention register''s always-on latch holds the state during power-down.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s5-01','soc','soc-l8','A path fails on first silicon at every clock frequency, even a very slow one. Likely cause?','["Clock-domain-crossing metastability","DRAM refresh","Setup violation","Hold violation"]',3,'Hold slack does not depend on the clock period, so a failure that persists at any frequency points to hold.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s5-02','soc','soc-l8','What runs first after reset on most SoCs?','["The DRAM training firmware from DRAM","The Linux kernel","Immutable boot ROM code","U-Boot from DRAM"]',2,'The boot ROM is the root of trust and loads the next stage.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s5-03','soc','soc-l8','What is the main purpose of a FIB edit on first silicon?','["Measure leakage","Program fuses","Validate a fix by rewiring a few nets on a sample before a respin","Increase yield in production"]',2,'It is a lab fix on individual dies to confirm a change before new masks.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s5-04','soc','soc-l8','A path passes at low frequency and fails above 1.8 GHz at nominal voltage. Likely cause?','["A missing level shifter","Hold violation","Isolation failure","Setup (critical path) violation"]',3,'Failures that depend on frequency come from setup (max-delay) paths.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s6-01','soc','soc-extra','In an AXI read burst, how does the manager know the last beat arrived?','["A B-channel response","RLAST is asserted on the final beat","The ARLEN counter only","RVALID goes low"]',1,'RLAST marks the last data transfer of a read burst.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s6-02','soc','soc-l5','Double buffering hides DMA latency completely when:','["Transfer time per tile <= compute time per tile","Compute time < transfer time","The scratchpad is a cache","The DMA engine is idle"]',0,'Each transfer finishes while the previous tile is being computed.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s6-03','soc','soc-extra','Which structure safely moves multi-bit data between two asynchronous clock domains?','["An asynchronous FIFO with Gray-coded pointers","A level shifter","A single flip-flop","A wire"]',0,'Async FIFOs with Gray-coded pointers (synchronized through two flops) move multi-bit data safely between clock domains.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s6-04','soc','soc-l5','What usually tells an accelerator that new work is queued?','["An MMIO doorbell write","A page fault","Polling host DRAM continuously","A JTAG command"]',0,'The driver writes a doorbell register after updating the queue.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-soc-s6-05','soc','soc-l6','A 64x64 BF16 A tile and a 64x64 BF16 B tile are double-buffered, plus one 64x64 FP32 accumulator. Scratchpad needed?','["24 KB","32 KB","48 KB","64 KB"]',2,'Inputs: 2 x (8 KB + 8 KB) = 32 KB; accumulator: 64 x 64 x 4 B = 16 KB; total 48 KB.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v0-01','vlsi','vlsi-v0','Which order is correct in a standard physical design flow?','["CTS -> floorplan -> placement -> routing","Placement -> floorplan -> routing -> CTS","Floorplan -> CTS -> placement -> routing","Floorplan -> placement -> CTS -> routing"]',3,'The clock tree is built after cells are placed and before detailed routing.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v0-02','vlsi','vlsi-v0','Which file gives cell timing and power data to STA and synthesis?','["LEF","SDC","Liberty (.lib)","GDSII"]',2,'Liberty holds delay and power tables; LEF holds abstract physical geometry; SDC holds constraints.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v0-03','vlsi','vlsi-v0','LVS fails. What does that mean?','["Timing does not close","A spacing rule is violated","IR drop is too high","The layout''s connectivity or devices do not match the netlist"]',3,'LVS compares the extracted layout netlist to the reference netlist.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v0-04','vlsi','vlsi-v0','Hold fixing is mostly done after CTS because:','["Setup must be broken first","Real clock skew is known only after the clock tree exists","Hold does not exist before CTS","Routing removes hold violations"]',1,'With ideal clocks the skew is zero; post-CTS skew decides actual hold slack.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v0-05','vlsi','vlsi-v0','Which signoff analysis finds wires whose current density will wear them out over the chip''s lifetime?','["Electromigration (EM) analysis","DRC","LVS","Static timing analysis"]',0,'EM checks current density against limits for each metal layer and via.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v1-01','vlsi','vlsi-v1','An inverter drives 10 fF at 0.8 V, 2 GHz, activity factor 0.1. Its dynamic power is about:','["1.28 uW","12.8 uW","0.64 uW","128 uW"]',0,'P = 0.1 x 10e-15 x 0.64 x 2e9 = 1.28e-6 W.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v1-02','vlsi','vlsi-v1','Which change reduces dynamic power quadratically?','["Halving the load capacitance","Lowering the supply voltage","Halving the frequency","Halving the activity factor"]',1,'P scales with V^2; the other factors are linear.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v1-03','vlsi','vlsi-v1','Why are NAND gates generally preferred over NOR gates in CMOS?','["NAND uses fewer transistors","NAND has no static power","NOR cannot be built in CMOS","NOR has series PMOS, and PMOS has lower mobility, so NOR is slower or larger"]',3,'Series PMOS stacks must be upsized to match drive, costing area and input capacitance.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v1-04','vlsi','vlsi-v1','V_OH = 1.0 V, V_IH = 0.6 V, V_IL = 0.4 V, V_OL = 0.05 V. NM_H and NM_L are:','["0.4 V and 0.35 V","0.35 V and 0.4 V","0.6 V and 0.4 V","0.95 V and 0.2 V"]',0,'NM_H = 1.0 - 0.6 = 0.4 V; NM_L = 0.4 - 0.05 = 0.35 V.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v1-05','vlsi','vlsi-v1','In velocity-saturated short-channel devices, saturation current scales roughly as:','["(V_gs - V_t)","exp(V_gs - V_t)","(V_gs - V_t)^2","Independent of V_gs"]',0,'Velocity saturation makes the dependence close to linear.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v2-01','vlsi','vlsi-v2','T = 1 ns, t_clk-q = 100 ps, t_logic,max = 800 ps, t_setup = 50 ps, skew = +30 ps (capture later). Setup slack?','["50 ps","80 ps","20 ps","-30 ps"]',1,'Slack = (1000 + 30) - (100 + 800 + 50) = 80 ps.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v2-02','vlsi','vlsi-v2','t_clk-q = 100 ps, t_logic,min = 20 ps, t_hold = 60 ps, skew = +30 ps. Hold slack?','["30 ps","60 ps","-10 ps","90 ps"]',0,'Slack = (100 + 20) - (60 + 30) = 30 ps.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v2-03','vlsi','vlsi-v2','Positive clock skew (capture clock arrives later) has what effect?','["Helps both","Affects neither","Helps hold, hurts setup","Helps setup, hurts hold"]',3,'Later capture gives the data more time (setup) but also lets new data arrive too soon relative to the late edge (hold).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v2-04','vlsi','vlsi-v2','Which fix trades leakage for speed?','["Adding hold buffers","Increasing the clock period","Downsizing a cell","Swapping a cell to a lower-V_t variant"]',3,'Lower V_t gives faster switching but exponentially higher leakage.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v2-05','vlsi','vlsi-v2','Swapping a cell to a lower-V_t variant fixes setup on one path. Which check must be rerun?','["Hold on paths through the same cell, plus leakage power","DRC only","LVS only","Nothing"]',0,'A faster cell shortens min-delay paths too and raises leakage.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v4-01','vlsi','vlsi-v4','During a 6T read, the cell flips. The most likely sizing error is:','["Access transistor stronger than pull-down","Pull-up stronger than access","Bitlines precharged to VDD","Pull-down much stronger than access"]',0,'If access beats pull-down, the 0 node rises past the trip point and the cell flips.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v4-02','vlsi','vlsi-v4','Which relation of strengths is required for a reliable 6T cell?','["PU > access > PD","access > PD > PU","PD > access > PU","All equal"]',2,'PD > access keeps reads safe; access > PU makes writes possible.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v4-03','vlsi','vlsi-v4','Why is read SNM lower than hold SNM?','["The sense amplifier injects noise","The on access transistor pulls the 0 node toward the precharged bitline","The wordline is off during reads","Reads use a lower VDD"]',1,'The access path degrades the inverter VTC on the 0 side during reads.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v4-04','vlsi','vlsi-v4','What is the main reason CIM macros often use 8T or 10T cells?','["No need for sense amplifiers","A decoupled read path that cannot disturb the stored value when many rows are read at once","Higher density","Lower leakage only"]',1,'Decoupled read ports isolate storage nodes from the bitline activity of multi-row reads.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-vlsi-v4-05','vlsi','vlsi-v4','Writing 0 into a 6T cell node that holds 1 requires the access transistor to overpower which transistor?','["The pull-up PMOS on that node","The precharge transistor","The sense amplifier","The pull-down NMOS on that node"]',0,'The 1 node is held high by its pull-up PMOS; the access device must pull it below the trip point.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g1-01','gpu','gpu-g1','Half of a warp''s threads take the if-branch and half the else-branch, each of equal length. Relative to no divergence, the warp takes about:','["The same time","32x as long","2x as long","Half as long"]',2,'Both paths run one after the other with half the lanes masked each time.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g1-02','gpu','gpu-g1','GPUs hide DRAM latency mainly through:','["Switching among many resident warps","Branch prediction","Big L1 caches alone","Large out-of-order windows"]',0,'Zero-cost warp switching keeps the pipelines busy while other warps wait.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g1-03','gpu','gpu-g1','How many threads are in an NVIDIA warp?','["16","32","64","128"]',1,'NVIDIA warps have 32 threads; AMD CDNA wavefronts have 64.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g1-04','gpu','gpu-g1','What does Hopper''s TMA do?','["Moves tensor tiles asynchronously between global and shared memory","Schedules warps","Performs FP8 math","Manages the L2 cache policy"]',0,'TMA is a copy engine that frees threads from computing addresses and issuing loads.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g1-05','gpu','gpu-g1','What is the maximum number of resident warps per SM on H100?','["32","48","64","128"]',2,'H100 allows 2048 resident threads per SM, which is 64 warps.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g2-01','gpu','gpu-g2','A kernel does 2 FLOPs per 8 bytes loaded on a GPU with 1000 TFLOP/s peak and 4 TB/s bandwidth. Its attainable throughput is about:','["1000 TFLOP/s","1 TFLOP/s","250 TFLOP/s","4 TFLOP/s"]',1,'Intensity is 0.25 FLOP/B; 0.25 x 4 TB/s = 1 TFLOP/s, far below peak.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g2-02','gpu','gpu-g2','Thread i reads a[i * 32] (4-byte floats). Compared with a[i], this access pattern:','["Is equally coalesced","Is faster due to stride prefetching","Causes bank conflicts in registers","Needs about one transaction per thread instead of a few per warp"]',3,'Each thread touches a different 128-byte region, so coalescing is lost.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g2-03','gpu','gpu-g2','Which change most directly raises a GEMM kernel''s arithmetic intensity?','["Larger shared-memory/register tiles","More threads per block","Using global atomics","Higher clock frequency"]',0,'Bigger tiles mean each loaded element is reused for more FLOPs.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g2-04','gpu','gpu-g2','A 32x32 float tile stored row-major in shared memory is read column-wise by a warp. What happens, and the usual fix?','["Coalescing failure; use texture memory","32-way bank conflicts; pad rows to 33 floats","No issue","Register spills; reduce the tile"]',1,'Each column element falls in the same bank; padding shifts each row by one bank.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g2-05','gpu','gpu-g2','Which TPU generation moved to 256x256 MXUs?','["TPU v4","TPU v6e (Trillium)","TPU v1","TPU v2"]',1,'Trillium (v6e) enlarged the MXU from 128x128 to 256x256.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g3-01','gpu','gpu-g3','N = 1000 and blockDim = 256. How many blocks are needed?','["3","4","1000","256"]',1,'ceil(1000/256) = 4; the last block masks off 24 threads.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g3-02','gpu','gpu-g3','In Triton, what does the mask in tl.load prevent?','["Race conditions between blocks","Register spills","Out-of-bounds accesses in the last, partial block","Bank conflicts"]',2,'Lanes whose offsets are past n are masked so they neither load nor store.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g3-03','gpu','gpu-g3','Why subtract the row maximum in softmax?','["It reduces the row length","It is needed for coalescing","It makes the kernel faster","It prevents exp overflow without changing the result"]',3,'softmax(x) = softmax(x - c) for any constant c; using the max keeps exponents <= 0.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g3-04','gpu','gpu-g3','Which statement about Triton is correct?','["Triton requires manual shared-memory allocation","Each Triton program instance is one thread","Triton only targets CPUs","Each program instance processes a block of data, and the compiler maps it to threads"]',3,'Triton is block-level; thread mapping and shared memory are the compiler''s job.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g3-05','gpu','gpu-g3','An AMD CDNA wavefront has how many work-items?','["16","32","64","128"]',2,'CDNA GPUs execute 64-wide wavefronts.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g4-01','gpu','gpu-g4','FlashAttention reduces which cost the most?','["Parameter count","HBM reads and writes of the N x N attention matrix","Number of heads","Total FLOPs"]',1,'It keeps tiles in SRAM and never stores the full score matrix; FLOPs stay about the same (backward even recomputes).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g4-02','gpu','gpu-g4','During online softmax, a new block raises the running max from m_old to m_new. The previous partial output must be multiplied by:','["exp(m_new - m_old)","m_new / m_old","1","exp(m_old - m_new)"]',3,'Earlier terms were exponentiated relative to m_old; rescaling by exp(m_old - m_new) puts them relative to m_new.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g4-03','gpu','gpu-g4','Which feature is specific to FlashAttention-3?','["Recomputation in the backward pass","Tiling Q, K and V","Warp specialization with TMA and asynchronous WGMMA on Hopper","Online softmax"]',2,'FA3 uses Hopper''s asynchrony; tiling and online softmax date from FA1.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g4-04','gpu','gpu-g4','Flash-Decoding speeds up batch-1 long-context decode by:','["Running prefill and decode together","Quantizing the KV cache","Splitting the KV sequence across blocks and reducing the partial results","Skipping the softmax"]',2,'Splitting the sequence dimension creates enough parallel work to occupy all SMs.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-gpu-g4-05','gpu','gpu-g4','How does FlashAttention''s backward pass avoid storing the N x N probability matrix?','["It skips gradients for V","It approximates the gradient","It recomputes attention tiles from Q, K, V and the saved softmax statistics","It stores the matrix in FP8"]',2,'Only the output and per-row log-sum-exp are saved; tiles are recomputed in SRAM.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l1-01','mlsys','mlsys-l1','A model has 64 query heads and 8 KV heads (GQA). Compared with MHA, its KV cache is:','["1/8 the size","The same size","1/2 the size","1/64 the size"]',0,'KV storage scales with KV heads: 8/64 = 1/8.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l1-02','mlsys','mlsys-l1','RoPE makes the attention score between two tokens depend on:','["Absolute positions only","Their relative position","The layer index","The batch size"]',1,'Rotations compose so q_m . k_n depends on m - n.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l1-03','mlsys','mlsys-l1','Why can a Mamba-style model decode with constant memory per token?','["It drops old tokens","It keeps a fixed-size recurrent state instead of a KV cache that grows with context","It has no MLP layers","It uses FP4 weights"]',1,'The recurrence summarizes the past in a constant-size state.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l1-04','mlsys','mlsys-l1','An MoE layer has 64 experts, top-2 routing, each expert 100M parameters. Expert parameters active per token:','["100M","200M","3.2B","6.4B"]',1,'Each token uses 2 experts: 2 x 100M = 200M (plus the router).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l1-05','mlsys','mlsys-l1','What does RMSNorm drop compared with LayerNorm?','["The division by a statistic","The learned scale","Mean subtraction (re-centering) and the bias","Nothing"]',2,'It normalizes by the root-mean-square only; the learned gain is kept.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l2-01','mlsys','mlsys-l2','Which technique mainly speeds up memory-bound batch-1 decode?','["4-bit weight-only quantization","W8A8 with INT8 tensor cores","Larger prefill chunks","More pipeline stages"]',0,'Decode time is dominated by reading weights; 4-bit weights cut that traffic 4x versus BF16.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l2-02','mlsys','mlsys-l2','PagedAttention mainly solves:','["Softmax overflow","Tokenizer speed","KV-cache memory fragmentation and over-reservation","Tensor-parallel communication"]',2,'Block-based KV allocation allocates memory only as sequences grow.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l2-03','mlsys','mlsys-l2','Speculative decoding with standard rejection sampling produces outputs that are:','["Exactly distributed like the target model''s","Approximately like the target model''s","Greedy only","Like the draft model''s"]',0,'The accept/reject rule preserves the target distribution exactly.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l2-04','mlsys','mlsys-l2','In Megatron tensor parallelism, how many all-reduces does one transformer layer need in the forward pass?','["0","1","2","4"]',2,'One after the attention output projection and one after the MLP''s second matmul.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l2-05','mlsys','mlsys-l2','How large is an MXFP4 scaling block?','["8 elements","16 elements","32 elements","128 elements"]',2,'OCP MX formats share one E8M0 scale per 32 elements; NVFP4 uses 16.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l3-01','mlsys','mlsys-l3','KV-cache bytes per token = 2 x layers x kv_heads x head_dim x bytes. For 32 layers, 8 KV heads, head dim 128, BF16:','["65,536 B","131,072 B","262,144 B","32,768 B"]',1,'2 x 32 x 8 x 128 x 2 = 131,072 B (128 KiB).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l3-02','mlsys','mlsys-l3','A 70B BF16 model decodes at batch 1 with 3.35 TB/s of total bandwidth. Upper bound on tokens/s?','["About 2","About 24","About 240","About 2400"]',1,'140 GB per token: 3.35e12 / 1.4e11 is about 24 tokens/s.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l3-03','mlsys','mlsys-l3','Going from batch 1 to batch 64 decode changes weight-read intensity roughly from:','["1 to 1 FLOP/B","1 to 64 FLOP/B","64 to 1 FLOP/B","2 to 4 FLOP/B"]',1,'Weights are read once per step and used by all 64 sequences.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-mlsys-l3-04','mlsys','mlsys-l3','What is ONNX?','["A serving engine","An MLIR dialect only","A GPU kernel language","A framework-neutral model graph and operator-set format"]',3,'ONNX is an exchange format that runtimes and compilers import.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-accel-x1-01','accel','accel-x1','The TPU''s matrix unit uses which dataflow?','["Row-stationary","Output-stationary","Weight-stationary","No local reuse"]',2,'Weights are preloaded into the MXU and activations stream through.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-accel-x1-02','accel','accel-x1','A 128x128 array runs a GEMM with only 16 output columns. The best-case utilization is about:','["100%","50%","12.5%","1.6%"]',2,'Only 16 of 128 columns have work: 16/128 = 12.5%.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-accel-x1-03','accel','accel-x1','Peak 400 TFLOP/s and 2 TB/s. A kernel with intensity 100 FLOP/B is:','["Memory-bound at 100 TFLOP/s","Memory-bound at 200 TFLOP/s","Compute-bound at 200 TFLOP/s","Compute-bound at 400 TFLOP/s"]',1,'Ridge = 200 FLOP/B; 100 x 2 TB/s = 200 TFLOP/s attainable.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-accel-x1-04','accel','accel-x1','Which dataflow keeps partial sums in each PE until the output is complete?','["Weight-stationary","Output-stationary","Input-stationary","Row-stationary"]',1,'Output-stationary accumulates each output in place, avoiding partial-sum traffic.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-accel-x1-05','accel','accel-x1','Ideal cycles for a 1024^3 GEMM on a 128x128 MAC array at full utilization:','["8,192","65,536","1,048,576","131,072"]',1,'1024^3 MACs / 16,384 MACs per cycle = 65,536 cycles.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-accel-x2-01','accel','accel-x2','Which 2025 chip is a commercial digital SRAM in-memory-compute inference accelerator?','["Google Ironwood","AMD MI350","d-Matrix Corsair","NVIDIA GB10"]',2,'Corsair puts digital compute inside SRAM arrays.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-accel-x2-02','accel','accel-x2','How much HBM does the AMD MI350 series carry?','["80 GB","141 GB","192 GB","288 GB"]',3,'MI350X/MI355X carry 288 GB of HBM3E.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-accel-x2-03','accel','accel-x2','What is Ironwood''s HBM capacity per chip?','["32 GB","95 GB","192 GB","288 GB"]',2,'Ironwood carries 192 GB of HBM3E per chip.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-accel-x2-04','accel','accel-x2','Analog CIM''s main disadvantage relative to digital CIM is:','["Lower energy efficiency","It cannot store weights","Noise, variation and ADC cost limiting precision","It needs HBM"]',2,'Analog sums are imprecise and digitizing them is costly.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-accel-x2-05','accel','accel-x2','What memory does NVIDIA GB10 use?','["80 GB HBM3","192 GB HBM3E","128 GB LPDDR5X shared by the CPU and GPU","32 GB GDDR7"]',2,'GB10 (DGX Spark) has 128 GB of unified LPDDR5X.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o0-01','os','os-u2','After pid = fork(), what is pid in the child?','["0","-1","The child''s own PID","The parent''s PID"]',0,'fork returns 0 in the child and the child''s PID in the parent (-1 on failure).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o0-02','os','os-u2','Which call replaces the current program while keeping the same PID?','["fork","exit","exec","wait"]',2,'exec loads a new program image into the existing process.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o0-03','os','os-u3','How does the kernel regain control from a user process stuck in an infinite loop?','["A page fault","The process is never interrupted","The process must call yield","A timer interrupt"]',3,'A periodic timer interrupt traps into the kernel, which can preempt the process.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o0-04','os','os-u2','A process exits but its parent never calls wait. The child is now:','["Running","A zombie","Swapped out","An orphan"]',1,'Its exit status stays in the process table until reaped.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o0-05','os','os-u1','A user-mode program executes an instruction that loads the page-table base register. What happens?','["The program is restarted from the beginning","It executes normally","The machine reboots","The CPU raises an exception and traps to the kernel"]',3,'Privileged instructions fault in user mode; the kernel then usually kills the process.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o1-01','os','os-u4','How many memory references can an x86-64 4-level page walk need in the worst case (no paging-structure caches)?','["1","2","4","8"]',2,'One read per level: PML4, PDPT, PD, PT; then the data access itself.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o1-02','os','os-u8','What does the Clock algorithm approximate?','["OPT","FIFO","LRU","Random"]',2,'It uses reference bits to give recently used pages a second chance, approximating LRU.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o1-03','os','os-u4','A process touches a page that is in the page cache but not yet mapped. This is:','["A segmentation fault","A minor page fault","A major page fault","A TLB shootdown"]',1,'No disk I/O is needed; only the page table entry is set.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o1-04','os','os-u4','What do PCIDs/ASIDs avoid on a context switch?','["Reloading CR3","Running the scheduler","Saving registers","Flushing the entire TLB"]',3,'Tagged TLB entries survive switches between address spaces.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o1-05','os','os-u8','With FIFO, adding a frame increases page faults for some reference strings. This is called:','["False sharing","Belady''s anomaly","Priority inversion","Thrashing"]',1,'Belady''s anomaly affects FIFO but not stack algorithms like LRU or OPT.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o2-01','os','os-u5','Which resource do two threads of the same process NOT share?','["Heap","Open file descriptors","Stack","Global variables"]',2,'Each thread has its own stack and registers.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o2-02','os','os-u5','Why use test-and-test-and-set instead of plain test-and-set spinning?','["It prevents deadlock","It needs no atomic instruction","It is fairer","Spinning on plain reads hits the local cache (shared state) and avoids constant invalidations"]',3,'Only when the lock looks free does a thread attempt the atomic write.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o2-03','os','os-u5','Thread A holds L1 and wants L2; thread B holds L2 and wants L1. Which fix is standard?','["Use more threads","Raise thread priority","Acquire locks in a single global order","Replace locks with sleep"]',2,'A global lock order removes circular wait.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o2-04','os','os-u5','A waiter uses if (!ready) cond_wait(...) and sometimes proceeds while ready is false. Why?','["Mesa semantics and spurious wakeups: the condition must be rechecked in a while loop","Condition variables count signals","The compiler removed the if","Mutexes are broken"]',0,'Wake-ups are hints; recheck the predicate after waking.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o2-05','os','os-u5','A semaphore initialized to 3 lets how many threads proceed past wait() before one blocks?','["1","2","3","4"]',2,'Each wait decrements; the 4th caller sees 0 and blocks.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o3-01','os','os-extra','Why does xv6 disable interrupts while holding a spinlock?','["So an interrupt handler on the same CPU cannot spin forever on a lock that CPU already holds","To flush the TLB","To save power","To make xchg atomic"]',0,'Without this, the handler would wait for a lock its own interrupted code can never release.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o3-02','os','os-u3','Which registers does xv6''s swtch save explicitly?','["Segment registers","All general-purpose registers","Only esp","Callee-saved registers (ebx, esi, edi, ebp) plus the return eip"]',3,'Caller-saved registers are already saved by the C calling convention at the call to swtch.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o3-03','os','os-u1','On a trap from user mode, where does the x86 CPU find the kernel stack pointer?','["On the user stack","In CR3","In the IDT entry","In the TSS (esp0)"]',3,'The TSS''s ss0:esp0 gives the stack to switch to; xv6 sets it in switchuvm.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o3-04','os','os-u4','Loading a new value into CR3 on x86 without PCIDs causes:','["A flush of non-global TLB entries","A page fault","Nothing","An interrupt"]',0,'Writing CR3 invalidates non-global TLB entries.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o3-05','os','os-u4','Why does xv6 map the kernel into every process''s address space?','["So system calls and interrupts can run kernel code without switching page tables","To save disk space","Because x86 requires it","To share user memory"]',0,'The kernel''s mappings are always present, so trap entry stays cheap.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o4-01','os','os-extra','Which function lets a PCIe device master the bus to perform DMA?','["pci_iomap","pci_set_master","copy_to_user","request_irq"]',1,'pci_set_master sets the Bus Master Enable bit in the device''s command register.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o4-02','os','os-extra','A driver''s descriptor ring is read by the device and written by the CPU throughout its life. Which allocation fits?','["vmalloc","A user-space buffer","dma_alloc_coherent","kmalloc and pass the virtual address"]',2,'Coherent memory stays consistent for both sides without per-access syncing.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o4-03','os','os-extra','How does user space usually find a character device driver?','["Through a /dev node whose major/minor numbers map to the registered driver","By calling the kernel module directly","By PCI vendor ID","Through /proc/cpuinfo"]',0,'The device number links the file to the driver''s file_operations.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o4-04','os','os-extra','What does pci_iomap return?','["An IRQ number","A DMA address","A user-space pointer","A kernel virtual address mapping a BAR for MMIO accesses"]',3,'Drivers then use ioread32/iowrite32 on that mapping.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z-os-o4-05','os','os-extra','Inside a driver''s read() handler, how is data returned to the user buffer?','["ioread32","dma_map_single","memcpy","copy_to_user"]',3,'copy_to_user validates the user pointer and handles faults.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p3-01','arch','arch-p3','A 5-stage pipeline has full forwarding. 25% of instructions are loads, and 40% of loads are immediately followed by an instruction that uses the loaded value. Ignoring other stalls, what is the CPI?','["1.40","1.04","1.25","1.10"]',3,'Only the load-use case stalls, 1 cycle each: CPI = 1 + 0.25 x 0.4 x 1 = 1.10.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p3-02','arch','arch-p3','A datapath has 10 ns of logic and a 0.5 ns register overhead. It is split into 5 equal stages, each with its own 0.5 ns register. Ignoring hazards, what is the throughput speedup over the unpipelined design?','["4.0x","3.5x","5.0x","4.2x"]',3,'Unpipelined cycle = 10 + 0.5 = 10.5 ns. Pipelined cycle = 10/5 + 0.5 = 2.5 ns. Speedup = 10.5 / 2.5 = 4.2x: the register overhead keeps it below 5x.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p3-03','arch','arch-p3','A core has base CPI 1.0. 20% of instructions are branches, 5% of branches are mispredicted, and the penalty is 15 cycles. What is the CPI?','["1.03","1.30","1.75","1.15"]',3,'CPI = 1.0 + 0.2 x 0.05 x 15 = 1.0 + 0.15 = 1.15.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p3-04','arch','arch-p3','An in-order pipeline has a 4-cycle multiplier and a 1-cycle ALU. A MUL writing r1 is followed by an ADD that also writes r1 (no reads of r1 in between). Which hazard must be handled?','["RAW","WAR","WAW","None: in-order issue prevents all hazards"]',2,'The ADD finishes first and the slow MUL would overwrite r1 later with the older value: a write-after-write (output) hazard, plus contention for the write-back port.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p3-05','arch','arch-p3','Which condition defines a precise exception?','["The handler runs within one cycle of the fault","All older instructions have committed, no younger one has changed architectural state, and the PC of the faulting instruction is saved","All in-flight instructions complete before the handler starts","The exception is reported in the same cycle it occurs"]',1,'Precision is about architectural state: everything before the faulting instruction is done, nothing after it is visible, so execution can restart cleanly.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-01','arch','arch-p4','A branch repeats the pattern T, T, T, N forever. In steady state, what misprediction rate does a single 2-bit saturating counter give?','["25%","50%","0%","12.5%"]',0,'The counter sits at strongly/weakly taken: the three Ts are predicted correctly, the N is mispredicted (counter drops to weakly taken), and the next T restores it. 1 of 4 = 25%. A 1-bit predictor would miss 2 of 4.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-02','arch','arch-p4','A loop branch is taken 9 times then not taken once, and the loop runs many times. With a 1-bit predictor per branch, what is the misprediction rate?','["20%","5%","0%","10%"]',0,'Two misses per loop execution: at the exit (predicted taken) and at the first iteration of the next execution (predicted not taken). 2 / 10 = 20%.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-03','arch','arch-p4','A gshare predictor has a 4,096-entry table of 2-bit counters. How much storage do the counters take?','["512 B","1 KB","2 KB","4 KB"]',1,'4,096 x 2 bits = 8,192 bits = 1,024 bytes = 1 KB (the history register is negligible).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-04','arch','arch-p4','In TAGE, which component provides the prediction when several tables hit?','["A majority vote of all hitting tables","The base bimodal table","The table with the shortest history","The tagged table with the longest matching history"]',3,'TAGE trusts the longest-history match (the most specific context); an alternate prediction is used when that entry is newly allocated and weak.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-05','arch','arch-p4','A core has 32 architectural integer registers and a 128-entry ROB; every instruction may write a register. How many physical registers guarantee that rename never stalls for lack of a free register?','["96","192","128","160"]',3,'32 hold the committed state and up to 128 in-flight instructions each need one: 32 + 128 = 160.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-06','arch','arch-p4','With a merged physical register file, when can the physical register previously mapped to r5 be freed after an instruction I renames r5?','["When I writes back","When I commits","When the previous producer of r5 commits","When I issues"]',1,'Until I commits, I could be squashed and the old mapping would be needed again; older readers have also read it by then. So it is freed at I''s commit.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-07','arch','arch-p4','To sustain IPC 4 while a load stalls at the head of the ROB for 100 cycles, roughly how many ROB entries are needed?','["100","200","400","800"]',2,'Little''s law: entries ~ throughput x latency = 4 x 100 = 400. Real ROBs are smaller, which is why long misses still stall the core.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-08','arch','arch-p4','In a 4-wide rename stage, each instruction has 2 sources that must be compared against the destinations of older instructions in the same group. How many comparators are needed?','["24","6","12","16"]',2,'Instruction k compares its 2 sources against k older destinations: 2 x (0 + 1 + 2 + 3) = 12. The count grows with W^2.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-09','arch','arch-p4','A load was speculatively assumed to hit in L1 and its dependent ADD was issued, but the load misses. What happens?','["The whole pipeline is flushed from the load onward","The load is converted into a prefetch and the ADD commits","The ADD uses stale data and an exception is raised","The ADD is cancelled and replayed when the data returns"]',3,'Load-hit speculation is repaired by selective replay of the dependents that issued too early, not by a full flush.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-10','arch','arch-p4','Which is the biggest practical problem for VLIW on general-purpose code?','["Variable latencies such as cache misses that a static schedule cannot predict","Complex rename logic","Branch target buffers cannot be used","Too many register-file ports"]',0,'The compiler fixes the schedule ahead of time; an unexpected cache miss stalls the whole bundle. (VLIW avoids dynamic rename and dependency checking by design.)');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p4-11','arch','arch-p4','A vector machine with 4 lanes executes a VADD on 64 elements. Ignoring startup latency, how many cycles does it take?','["4","16","64","256"]',1,'64 elements / 4 lanes = 16 cycles; each lane processes one element per cycle.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-01','arch','arch-p5','A 64 KB, 4-way cache with 64 B lines uses 40-bit physical addresses. How many tag bits?','["30","24","26","28"]',2,'Offset 6 bits; sets = 65,536 / (64 x 4) = 256, index 8 bits; tag = 40 - 8 - 6 = 26.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-02','arch','arch-p5','The same cache (26-bit tags) stores a valid and a dirty bit per line. Total tag-store size?','["4 KB","2.75 KB","3.5 KB","3.25 KB"]',2,'1,024 lines x (26 + 2) bits = 28,672 bits = 3,584 bytes = 3.5 KB.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-03','arch','arch-p5','L1: 1-cycle hit, 5% miss rate. L2: 12-cycle hit, 40% local miss rate. Memory: 150 cycles. What is the AMAT?','["4.6 cycles","8.5 cycles","4.0 cycles","3.6 cycles"]',0,'AMAT = 1 + 0.05 x (12 + 0.4 x 150) = 1 + 0.05 x 72 = 4.6 cycles.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-04','arch','arch-p5','L1 miss rate is 4% and the L2 local miss rate is 25%. What is the L2 global miss rate (misses per CPU memory access)?','["25%","4%","1%","29%"]',2,'Global = 0.04 x 0.25 = 0.01 = 1% of all accesses go to memory.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-05','arch','arch-p5','How many bits of state per set does tree pseudo-LRU need for an 8-way cache?','["16","3","7","8"]',2,'A binary tree over 8 ways has 7 internal nodes, one bit each (N - 1). True LRU needs at least 16 bits (log2 8! ~ 15.3).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-06','arch','arch-p5','A core has 10 MSHRs, 64 B lines and 100 ns memory latency. What is the maximum bandwidth it can draw from memory?','["12.8 GB/s","64 GB/s","640 MB/s","6.4 GB/s"]',3,'Little''s law: bandwidth = bytes in flight / latency = 10 x 64 B / 100 ns = 6.4 B/ns = 6.4 GB/s.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-07','arch','arch-p5','With 64 B lines and 100 ns latency, how many MSHRs does a core need to sustain 25.6 GB/s?','["20","40","80","10"]',1,'Bytes in flight = 25.6 GB/s x 100 ns = 2,560 B = 40 lines, so 40 outstanding misses.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-08','arch','arch-p5','With 16 KB pages, what is the largest 8-way VIPT L1 that avoids synonyms without extra hardware?','["32 KB","64 KB","128 KB","256 KB"]',2,'Index + offset must fit in the page offset: size / ways <= page size, so size <= 8 x 16 KB = 128 KB.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-09','arch','arch-p5','An inclusive L3 evicts a line that is also in a core''s L1. What must happen?','["The L3 eviction is cancelled","Nothing; L1 keeps its copy","The L1 copy is back-invalidated","The line is written to L2"]',2,'Inclusion requires every upper-level line to be in the L3, so the L3 eviction must invalidate (and write back if dirty) the upper copies.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-10','arch','arch-p5','Memory latency is 200 cycles, each loop iteration takes 20 cycles and consumes one new cache line. How many lines ahead must a prefetcher run to be timely?','["10","20","2","5"]',0,'The prefetch must be issued at least 200 / 20 = 10 iterations (lines) before the demand access.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-11','arch','arch-p5','With 4-level guest page tables and 4-level host (nested) page tables, how many memory references can a worst-case TLB miss take?','["16","24","25","8"]',1,'Each of the 4 guest levels plus the final guest physical address must be translated by a 4-level host walk: (4 + 1) x (4 + 1) - 1 = 24 references.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-12','arch','arch-p5','TLB lookups overlap the cache access (no cost on a hit). The TLB hit rate is 99% and a miss costs a 4-level walk with 50 ns per reference. Average translation overhead per access?','["0.2 ns","2 ns","3 ns","20 ns"]',1,'Miss cost = 4 x 50 = 200 ns; overhead = 0.01 x 200 = 2 ns per access.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-13','arch','arch-p5','A 1,536-entry L2 TLB maps 2 MB pages. What is its reach?','["6 MB","768 MB","1.5 GB","3 GB"]',3,'1,536 x 2 MB = 3,072 MB = 3 GB. With 4 KB pages the same TLB reaches only 6 MB.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-p5-14','arch','arch-p5','A cache has 8 banks interleaved by line (bank = line address mod 8) with 64 B lines. A loop reads addresses with a 512 B stride. How many banks does it use?','["4","8","1","2"]',2,'512 B = 8 lines, so every access lands in bank (n x 8) mod 8 = the same bank: all accesses conflict. An odd line stride would spread them.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-01','arch','arch-x1','DDR4-3200 has CL = 22 cycles. What is the CAS latency in ns?','["13.75 ns","22 ns","27.5 ns","6.9 ns"]',0,'3,200 MT/s is a 1,600 MHz clock, tCK = 0.625 ns. 22 x 0.625 = 13.75 ns.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-02','arch','arch-x1','tCL = tRCD = tRP = 14 ns (ignore burst time). With an open-page policy, 60% of accesses are row hits and the rest are row conflicts. Average access latency?','["22.4 ns","25.2 ns","28 ns","33.6 ns"]',1,'Hit = 14 ns, conflict = 14 + 14 + 14 = 42 ns. 0.6 x 14 + 0.4 x 42 = 8.4 + 16.8 = 25.2 ns.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-03','arch','arch-x1','Same timings: a closed-page policy precharges right after each access, so every access costs tRCD + tCL = 28 ns. Above what row-hit rate does open-page win (misses are conflicts)?','["75%","33%","50%","67%"]',2,'Open-page average = 14h + 42(1 - h). Set equal to 28: 42 - 28h = 28, h = 0.5. Above 50% hits, open-page is faster.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-04','arch','arch-x1','tRAS = 32 ns and tRP = 14 ns. What is tRC, the minimum time between activates to the same bank?','["46 ns","60 ns","18 ns","32 ns"]',0,'tRC = tRAS + tRP = 32 + 14 = 46 ns.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-05','arch','arch-x1','tRFC = 350 ns and tREFI = 7.8 us. Roughly what fraction of time is the rank busy refreshing?','["4.5%","9%","45%","0.45%"]',0,'350 / 7,800 ~ 0.045 = 4.5%. Higher-density chips have a longer tRFC, so the overhead grows.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-06','arch','arch-x1','DDR5 refreshes every row within 32 ms using 8,192 REF commands. What is tREFI?','["7.8 us","3.9 us","1.95 us","32 us"]',1,'32 ms / 8,192 = 3.9 us, half of DDR4''s 7.8 us (64 ms / 8,192).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-07','arch','arch-x1','An HBM3 stack has a 1,024-bit interface at 6.4 Gb/s per pin. Peak bandwidth per stack?','["204.8 GB/s","409.6 GB/s","819.2 GB/s","1.64 TB/s"]',2,'1,024 x 6.4 Gb/s = 6,553.6 Gb/s / 8 = 819.2 GB/s.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-08','arch','arch-x1','A DDR5 subchannel is 32 bits wide with burst length 16. How many bytes does one burst deliver?','["64 B","128 B","16 B","32 B"]',0,'32 bits x 16 beats = 512 bits = 64 B: one cache line per burst per subchannel.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-09','arch','arch-x1','Bank 0 has row 7 open. The queue holds, oldest first: R1 (bank 0, row 5), R2 (bank 0, row 7). Under FR-FCFS, which is served first?','["R1, because it is oldest","R2, because it is a row hit","Both at once","Neither until the row is closed"]',1,'FR-FCFS first prioritizes ready (row-hit) column commands, then age. R2 hits the open row and goes first.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-10','arch','arch-x1','How many check bits does SECDED need for 128 data bits?','["8","9","10","16"]',1,'SEC needs r with 2^r >= 128 + r + 1: r = 8 (256 >= 137; r = 7 gives 128 < 136). Add one overall parity bit for DED: 9.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-11','arch','arch-x1','In a Hamming(7,4) code with check bits at positions 1, 2 and 4, the recomputed syndrome is (p4, p2, p1) = (1, 0, 1). Which position flipped?','["2","3","5","6"]',2,'The syndrome read as a binary number gives the error position: 101 = 5.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-12','arch','arch-x1','A SECDED decoder sees a non-zero syndrome but the overall parity is correct. What does it conclude?','["No error","The parity bit itself flipped","Single-bit error; correct it","Double-bit error; detected, not correctable"]',3,'An even number of flips keeps overall parity correct while the syndrome is non-zero: a detected, uncorrectable double error.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-13','arch','arch-x1','Why is chipkill easier to build with x4 DRAM chips than with x8 chips?','["Each x4 chip contributes only 4 bits per beat, so a 4-bit-symbol code covers a whole chip with modest overhead","x8 chips cannot store ECC bits","x4 chips do not need refresh","x4 chips are faster"]',0,'Chipkill maps each chip to one code symbol. Narrow chips mean small symbols and more chips per codeword, so single-symbol correction is cheap; x8 needs larger symbols and relatively more check storage.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-14','arch','arch-x1','With tRC = 45 ns, about how many times can one bank activate a single aggressor row within a 64 ms refresh window?','["14 thousand","140 thousand","1.4 million","14 million"]',2,'64 ms / 45 ns ~ 1.42 million activations, far above the RowHammer thresholds of recent chips (thousands).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-15','arch','arch-x1','Double-sided RowHammer targeting victim row N hammers which rows?','["N only","N - 1 and N + 1","N + 2 and N - 2","All rows in the bank"]',1,'Alternating activations of both physical neighbors of the victim gives the strongest disturbance; mapping logical to physical rows is the attacker''s hard part.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-16','arch','arch-x1','In SIMDRAM''s vertical layout, one 8 KB DRAM row holds one bit of many elements. How many elements does one row operation process in parallel?','["65,536","512","1,024","8,192"]',0,'8 KB = 65,536 bits, one bit per element: 65,536 bit-serial lanes per row operation. Throughput comes from width, latency from the many row operations per n-bit op.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-17','arch','arch-x1','On UPMEM, how does one DPU get data that lives in another DPU''s bank?','["A shared on-DIMM cache","The host CPU reads it and writes it to the other DPU","Coherent loads from MRAM","Direct DPU-to-DPU links"]',1,'There is no direct inter-DPU path; communication goes through the host, which is a key limit for workloads that need exchanges between DPUs.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-18','arch','arch-x1','What is the arithmetic intensity of y = Wx with an N x N FP16 matrix (count only weight bytes, N large)?','["0.25 FLOP/B","1 FLOP/B","2 FLOP/B","N FLOP/B"]',1,'2N^2 FLOPs over 2N^2 bytes of weights = 1 FLOP/byte: firmly memory-bound, the classic PIM target.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-19','arch','arch-x1','An analog crossbar activates 128 rows with binary inputs and binary cells. What minimum ADC resolution captures every column sum exactly?','["10 bits","6 bits","7 bits","8 bits"]',3,'Column sums range 0..128: 129 levels, and 7 bits encode only 128. So 8 bits; designs often activate fewer rows to use cheaper ADCs.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-20','arch','arch-x1','A host writes 100 GB to an SSD, and the NAND sees 300 GB of programs. What is the write amplification?','["3","300","0.33","1"]',0,'WA = NAND writes / host writes = 300 / 100 = 3, mostly from garbage-collection copies.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x1-21','arch','arch-x1','Which kernel benefits most from near-bank PIM?','["Batch-1 GEMV over weights too large for on-chip memory","Small convolution that fits in L1","Branchy scalar code","Large-batch GEMM"]',0,'GEMV has little reuse (about 1 FLOP/B), so it is bound by memory bandwidth; PIM exposes the higher internal bank bandwidth. Large GEMMs reuse data and do well on GPUs.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-01','arch','arch-x2','MOESI: core A holds a line in M, and core B reads it. What are the final states?','["A: S, B: S, memory updated","A: O, B: S, no write-back","A: I, B: M","A: E, B: S"]',1,'The Owned state lets A supply the dirty data and keep responsibility for the write-back: A moves to O, B gets S.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-02','arch','arch-x2','MESI, snooping: cores A and B both hold a line in S. A writes it. What happens?','["A writes through to memory and stays in S","A writes silently and moves to M","A broadcasts an invalidate (upgrade); B goes to I and A to M","B is updated with the new value and both stay in S"]',2,'Only E allows a silent upgrade. From S, A must invalidate other copies first.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-03','arch','arch-x2','A full-bit-vector directory tracks 64 cores for 64 B lines. Presence-bit overhead relative to data?','["12.5%","25%","1.6%","6.25%"]',0,'64 bits per 512-bit line = 12.5% (before state bits), which is why large systems use sparse or coarse directories.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-04','arch','arch-x2','T1: data = 1; flag = 1. T2: while (flag == 0) {} ; r = data. With no fences, on which machine can T2 read r = 0?','["Sequentially consistent","x86-TSO","Arm (weakly ordered)","None of them"]',2,'TSO keeps store-store and load-load order, so the message-passing pattern works. Arm may reorder either side; it needs a release store/acquire load or barriers.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-05','arch','arch-x2','80% of run time is offloaded to an accelerator that is 10x faster. Overall speedup?','["2.78x","3.57x","4.5x","8.0x"]',1,'1 / (0.2 + 0.8 / 10) = 1 / 0.28 = 3.57x.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-06','arch','arch-x2','A program is 95% parallel. What is the maximum speedup with unlimited cores?','["Unlimited","19x","20x","95x"]',2,'Amdahl: 1 / (1 - 0.95) = 20x.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-07','arch','arch-x2','Gustafson: a scaled workload has a 10% serial fraction (measured on the parallel machine). Scaled speedup on 16 processors?','["14.5x","16x","6.4x","10x"]',0,'S = N - s (N - 1) = 16 - 0.1 x 15 = 14.5x.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-08','arch','arch-x2','Why does test-and-test-and-set reduce coherence traffic compared with test-and-set?','["Waiters spin on a shared read-only copy and try the atomic only when the lock looks free","It disables the cache for the lock","It uses a directory instead of snooping","It uses a cheaper atomic"]',0,'Plain reads keep the line in S in every waiter''s cache; only the release and the following attempts generate invalidations.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-09','arch','arch-x2','A prefetcher''s accuracy drops to 20% and it is evicting useful lines. What should feedback-directed throttling do?','["Raise the degree","Raise the distance","Lower its aggressiveness","Switch to write-through"]',2,'Low accuracy and high pollution mean most prefetches waste bandwidth and capacity: reduce distance/degree.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-10','arch','arch-x2','Spectre v1 leaks a secret mainly through:','["A branch predictor table overflow","Corrupted architectural registers","A cache footprint left by speculatively executed loads","A page fault"]',2,'Squashed instructions leave no architectural trace, but the lines they brought into the cache remain and can be measured with a timing probe.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-11','arch','arch-x2','In credit-based flow control, when may an upstream router send a flit on a virtual channel?','["Only after a NACK timeout","When the packet''s tail flit has arrived","Whenever the link is idle","When it holds at least one credit for that channel''s downstream buffer"]',3,'Credits count free downstream buffer slots; sending consumes one, and the downstream router returns it when the slot frees.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-arch-x2-12','arch','arch-x2','Why does LL/SC avoid the ABA problem that compare-and-swap has?','["SC fails if any write to the line happened since the LL, even if the value returned to the original","LL locks the bus","CAS cannot be used on 64-bit values","SC compares values twice"]',0,'LL/SC tracks whether the location was written, not whether the value changed, so A -> B -> A still makes SC fail.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-01','gpu','gpu-g2','An SM has 65,536 registers and supports 2,048 threads. A kernel uses 64 registers per thread. What is the maximum occupancy (registers only)?','["25%","50%","75%","100%"]',1,'65,536 / 64 = 1,024 threads = 32 of 64 warps = 50%.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-02','gpu','gpu-g2','An SM has 100 KB of shared memory available and each block uses 40 KB. How many blocks fit per SM (shared memory only)?','["4","1","2","3"]',2,'floor(100 / 40) = 2 blocks; the remaining 20 KB is unused.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-03','gpu','gpu-g2','Thread i of a warp reads float s[2 * i] from shared memory (32 banks, 4-byte words). What happens?','["4-way bank conflict","32-way bank conflict","No conflict","2-way bank conflict"]',3,'Bank = 2i mod 32, so threads i and i + 16 share a bank: every bank gets 2 requests, a 2-way conflict.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-04','gpu','gpu-g2','Which shared-memory word stride is conflict-free for a full warp (32 banks, 4-byte words)?','["4","3","16","2"]',1,'Any odd stride is coprime with 32, so 32 threads map to 32 distinct banks. Even strides cause conflicts.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-05','gpu','gpu-g2','A warp reads 32 consecutive 4-byte floats starting 4 bytes past a 128-byte boundary. How many 32-byte sectors are fetched?','["4","5","8","32"]',1,'The 128 bytes span offsets 4..131, crossing into a fifth 32-byte sector. Aligned, it would be 4.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-06','gpu','gpu-g2','A GPU has 3 TB/s of bandwidth and about 500 ns of memory latency. How many bytes must be in flight to saturate it?','["15 MB","150 KB","1.5 MB","6 MB"]',2,'Little''s law: 3e12 B/s x 500e-9 s = 1.5e6 B = 1.5 MB.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-07','gpu','gpu-g2','A GPU peaks at 1,000 TFLOP/s with 3.35 TB/s. A kernel has arithmetic intensity 100 FLOP/B. Attainable performance per the roofline?','["1,000 TFLOP/s","3.35 TFLOP/s","100 TFLOP/s","335 TFLOP/s"]',3,'min(1,000, 100 x 3.35) = 335 TFLOP/s: memory-bound, since the ridge is ~300 FLOP/B.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-08','gpu','gpu-g2','In FP16 weight-dominated GEMV, intensity grows about linearly with batch size B (about B FLOP/B). With a ridge point near 300 FLOP/B, roughly which batch makes the layer compute-bound?','["~30","~300","~3,000","~3"]',1,'Each weight (2 bytes) is used for 2B FLOPs, so intensity ~ B. Reaching ~300 needs a batch of roughly 300.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g1-01','gpu','gpu-g1','A block has 100 threads. How many warps does it occupy, and what fraction of lanes do useful work?','["3 warps, 100%","4 warps, ~78%","4 warps, 100%","5 warps, ~63%"]',1,'ceil(100 / 32) = 4 warps = 128 lanes; 100 / 128 ~ 78%. Use multiples of 32.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g1-02','gpu','gpu-g1','Since Volta, why should warp-level code call __syncwarp() or *_sync intrinsics?','["Shuffles are otherwise disabled","To flush the L1","Independent thread scheduling no longer guarantees that a warp''s threads execute in lockstep","To raise occupancy"]',2,'Each thread has its own PC; implicit warp-synchronous assumptions can break, so synchronization within the warp must be explicit.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-vlsi-v4-01','vlsi','vlsi-v4','Two wordlines of a 6T SRAM column are raised together with BL and BLB precharged. BL stays high. What does that tell you?','["Both cells store 0","Both cells store 1 (BL computes AND)","The cells differ","Nothing; the read is destructive"]',1,'Any cell storing 0 discharges BL, so BL high means both are 1: AND. BLB high would mean both are 0 (NOR).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-vlsi-v4-02','vlsi','vlsi-v4','Which technique helps writes without weakening read stability?','["Negative bitline during write","Larger pull-down transistors","Raising the cell supply during write","Wordline underdrive"]',0,'Driving BL below ground strengthens the access transistor only during writes. Underdrive and bigger pull-downs help reads; raising supply during write makes writing harder.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-l6-01','soc','soc-l6','What lets a TLB keep entries of several processes across a context switch?','["Larger pages","ASID/PCID tags on each entry","Write-through page tables","A victim TLB"]',1,'Tagging entries with an address-space ID avoids flushing the TLB on every switch.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-01','accel','accel-x1','Using Horowitz''s 45 nm numbers, one DRAM access (1.3-2.6 nJ) costs about as much energy as how many 8-bit integer multiplies (0.2 pJ)?','["~65","~650","~6,500-13,000","~1,000,000"]',2,'1.3 nJ / 0.2 pJ = 6,500 and 2.6 nJ / 0.2 pJ = 13,000. This gap is why every accelerator is designed around reuse.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-02','accel','accel-x1','An accelerator keeps a 128 x 128 BF16 output tile on-chip and streams the K dimension. What is the tile''s DRAM arithmetic intensity?','["64 FLOP/B","32 FLOP/B","128 FLOP/B","256 FLOP/B"]',0,'Intensity = 2*Tm*Tn / (b*(Tm + Tn)) = 2*128*128 / (2*256) = 64 FLOP/B.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-03','accel','accel-x1','A 3x3 conv layer has 128 input and 128 output channels and a 28 x 28 output (batch 1). How many MACs?','["57.8 M","231.2 M","1.04 G","115.6 M"]',3,'128 * 128 * 9 * 28 * 28 = 147,456 * 784 = 115,605,504, about 115.6 M MACs (0.23 GFLOP).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-04','accel','accel-x1','Each INT8 x INT8 product can be as large as 2^14 in magnitude. About how many worst-case products fit in a signed 32-bit accumulator before overflow is possible?','["2^15 (~32K)","2^17 (~131K)","2^24 (~16.8M)","2^31 (~2.1B)"]',1,'2^31 / 2^14 = 2^17, about 131K. Any realistic dot-product length K is far below this, so INT32 accumulators are standard.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-05','accel','accel-x1','With 2:4 structured sparsity, FP16 weights plus 2-bit indices compress a group of 4 weights from 64 bits to:','["32 bits (2.0x)","40 bits (1.6x)","36 bits (1.78x)","48 bits (1.33x)"]',2,'2 kept values * 16 bits + 2 indices * 2 bits = 36 bits; 64/36 = 1.78x.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-06','accel','accel-x1','A 128 x 128 weight-stationary array streams M = 1024 input rows per weight fold. Using utilization of about M/(M + R + C) for fill and drain, what is the utilization?','["80%","67%","50%","94%"]',0,'1024 / (1024 + 128 + 128) = 1024/1280 = 80%. For M = 1 (batch-1 decode) it would be below 1%.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-07','accel','accel-x1','Zero gating (detecting a zero operand and not toggling the multiplier) saves:','["Only area","Cycles, but not energy","Both energy and cycles","Energy, but not cycles"]',3,'Gating avoids switching but the PE still spends the cycle. Saving cycles needs zero skipping, which uses compressed formats and index logic.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-08','accel','accel-x1','Symmetric per-tensor INT8 quantization of weights with max|w| = 0.635. What integer does w = 0.1 map to?','["13","20","25","32"]',1,'s = 0.635/127 = 0.005, and round(0.1/0.005) = 20.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-09','accel','accel-x1','Why is per-output-channel weight scaling essentially free in an INT8 GEMM, while per-input-channel (per-K) scaling is not?','["Per-K scales would need FP32 weights","Input channels are never quantized","Output-channel scales are constant over the K-sum, so they are applied once after accumulation","Hardware cannot store more than one scale per tensor"]',2,'y_n = s_x * s_w[n] * sum_k(q_x * q_w): s_w[n] factors out of the sum and is applied in the epilogue. A per-K scale would sit inside the sum and break pure integer accumulation.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-10','accel','accel-x1','MXFP4 stores blocks of 32 FP4 elements with one shared 8-bit (E8M0) scale. Effective bits per element?','["4.25","4.0","4.5","5.0"]',0,'4 + 8/32 = 4.25 bits.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-11','accel','accel-x1','NVFP4 uses blocks of 16 FP4 elements with one FP8 E4M3 scale (ignoring the per-tensor FP32 scale). Effective bits per element?','["4.125","4.25","5.0","4.5"]',3,'4 + 8/16 = 4.5 bits. With an FP32 per-tensor scale over 4,096 elements it is 4.5078.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-12','accel','accel-x1','What is the largest finite value of FP8 E4M3 (OCP/NVIDIA variant)?','["240","448","57,344","65,504"]',1,'E4M3 tops out at 448 (it gives up infinities to extend the range). E5M2 reaches 57,344, and 65,504 is the FP16 maximum.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-13','accel','accel-x1','About how many hops does a packet travel on average in an 8 x 8 mesh NoC under uniform random traffic?','["~2.7","~8","~5.3","~14"]',2,'The average is about 2k/3; exactly 2(k^2 - 1)/(3k) = 2 * 63/24 = 5.25 for k = 8. The diameter is 14.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x1-14','accel','accel-x1','A 128 x 128 weight-stationary array at 1 GHz takes one BF16 activation per row per cycle. Required activation-buffer bandwidth?','["256 GB/s","128 GB/s","512 GB/s","32 TB/s"]',0,'128 rows * 2 B * 1e9 /s = 256 GB/s.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x2-01','accel','accel-x2','TPU v1 has 256 x 256 8-bit MACs at 700 MHz. Counting 2 ops per MAC, its peak is about:','["46 TOPS","23 TOPS","184 TOPS","92 TOPS"]',3,'65,536 * 2 * 700e6 = 9.2e13, about 92 TOPS.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x2-02','accel','accel-x2','TPU v1: 92 TOPS peak and 34 GB/s of weight bandwidth. An MLP with 200 ops per weight byte can attain at most about:','["34 TOPS","6.8 TOPS","92 TOPS","0.2 TOPS"]',1,'min(92, 200 * 34e9) = 6.8 TOPS: memory-bound, as the TPU paper found for most of its MLPs and LSTMs.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x2-03','accel','accel-x2','Which design has no off-chip DRAM and relies on about 230 MB of on-die SRAM per chip?','["Meta MTIA v2","Microsoft Maia 100","Groq LPU","Google TPU v4"]',2,'GroqChip: 230 MB of SRAM and up to 80 TB/s on-die. MTIA uses LPDDR5; Maia and TPU v4 use HBM.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x2-04','accel','accel-x2','Maia 100: 0.8 POPS dense BF16 and 1.8 TB/s of HBM. Its BF16 ridge point is about:','["444 FLOP/B","44 FLOP/B","4,444 FLOP/B","1,800 FLOP/B"]',0,'0.8e15 / 1.8e12 = about 444 FLOP/B.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x2-05','accel','accel-x2','SambaNova SN40L''s three memory tiers are:','["128 MB SRAM, 64 GB LPDDR5","230 MB SRAM, no DRAM","44 GB SRAM, external MemoryX","~520 MiB SRAM, 64 GiB HBM, up to 1.5 TiB DDR"]',3,'The others are Groq, Cerebras WSE-3 and MTIA v1.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x2-06','accel','accel-x2','How many RISC-V cores sit inside one Tenstorrent Tensix core?','["1","5","4","2"]',1,'Five: two data-movement cores and three compute cores (unpack, math, pack).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-accel-x2-07','accel','accel-x2','MTIA v1 pairs its 128 MB of on-chip SRAM with which off-chip memory?','["HBM3","GDDR6","LPDDR5","None"]',2,'64 GB of LPDDR5 (176 GB/s): cheap capacity for recommendation models, with the SRAM capturing the reuse.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-01-ml','gpu','gpu-g2','A BF16 GEMM with M = 256, K = N = 4096 runs on an A100 (ridge about 153 FLOP/B). It is:','["~228 FLOP/B, compute-bound","~1 FLOP/B, memory-bound","~228 FLOP/B, memory-bound","~4,096 FLOP/B, compute-bound"]',0,'MNK/(MK + KN + MN) = 256*4096/4608 = about 228 FLOP/B, which is above 153.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-02-ml','gpu','gpu-g2','Elementwise c = a + b on BF16 tensors. Arithmetic intensity?','["1 FLOP/B","0.25 FLOP/B","0.5 FLOP/B","~0.17 FLOP/B"]',3,'1 FLOP per (2 + 2 + 2) bytes = 1/6, about 0.17 FLOP/B.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g2-03-ml','gpu','gpu-g2','A100 SXM: 312 TFLOP/s dense BF16 and about 2.04 TB/s. Ridge point?','["~75 FLOP/B","~153 FLOP/B","~295 FLOP/B","~600 FLOP/B"]',1,'312e12 / 2.04e12 = about 153. (295 is the H100 SXM.)');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l1-01','mlsys','mlsys-l1','Using about 12*L*d^2, how many non-embedding parameters does a 32-layer, d = 4096 transformer have?','["~1.6B","~3.2B","~6.4B","~12.9B"]',2,'12 * 32 * 4096^2 = 384 * 16.78M = about 6.44B. Llama 2 7B adds embeddings and a slightly larger MLP to reach 6.7B.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l1-02','mlsys','mlsys-l1','Training FLOPs per token for a dense model with P parameters is about:','["6P","4P","2P","12P"]',0,'Forward 2P plus backward about 4P gives 6P, hence C = 6ND.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l1-03','mlsys','mlsys-l1','For d = 8192, at what context length do attention FLOPs (about 4nd) equal the dense FLOPs (about 24d^2) per token per layer?','["8,192","24,576","98,304","49,152"]',3,'n = 6d = 49,152.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l1-04','mlsys','mlsys-l1','Mixtral 8x7B (top-2 of 8 experts) uses how many parameters per token?','["46.7B","12.9B","5.8B","23.4B"]',1,'12.9B active of 46.7B total. Shared attention and embeddings make it more than 2/8 of the total.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l1-05','mlsys','mlsys-l1','DeepSeek-V2 MLA caches how many elements per token per layer?','["128","16,384","576","32,768"]',2,'A 512-dim latent plus a 64-dim RoPE key = 576, versus 32,768 for 128-head MHA.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l1-06','mlsys','mlsys-l1','Mistral 7B uses a sliding window W = 4096 over 32 layers. Its theoretical attention span is about:','["131,072 tokens","32,768 tokens","4,096 tokens","Unlimited"]',0,'Information moves up to W tokens per layer: 4096 * 32 = 131,072.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l2-01','mlsys','mlsys-l2','Speculative decoding with acceptance rate 0.8 and 4 draft tokens. Expected tokens per target pass?','["2.0","5.0","4.0","3.36"]',3,'(1 - 0.8^5)/(1 - 0.8) = (1 - 0.32768)/0.2 = 3.36.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l2-02','mlsys','mlsys-l2','A pipeline has p = 4 stages and m = 12 microbatches (GPipe/1F1B). What fraction of the total schedule is each GPU idle?','["8%","20%","25%","33%"]',1,'(p-1)/(m+p-1) = 3/15 = 20%. The 25% figure is bubble relative to ideal compute, (p-1)/m.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l2-03','mlsys','mlsys-l2','Ring all-reduce of 1 GB across 8 GPUs at 100 GB/s per GPU, ignoring latency, takes about:','["10 ms","20 ms","17.5 ms","80 ms"]',2,'2 * (7/8) * 1 GB = 1.75 GB per GPU; 1.75 GB / 100 GB/s = 17.5 ms.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l2-04','mlsys','mlsys-l2','A 7.5B model trained with mixed-precision Adam on 64 GPUs with ZeRO-3. Model-state memory per GPU (ignoring activations)?','["~1.9 GB","30 GB","15 GB","120 GB"]',0,'16 B * 7.5e9 = 120 GB, sharded 64 ways = 1.875 GB.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l2-05','mlsys','mlsys-l2','What does chunked prefill mainly fix?','["Expert load imbalance in MoE","KV-cache fragmentation","Accuracy loss from quantization","Decode latency spikes when a long prompt''s prefill monopolizes an iteration"]',3,'Splitting prefill into chunks and mixing them with decode tokens keeps inter-token latency bounded and the GPU busy.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l2-06','mlsys','mlsys-l2','Why does KIVI quantize the key cache per-channel but the value cache per-token?','["Values are never used in decode","Keys have a few outlier channels, so per-channel scales isolate them","Per-token scales need FP32","Keys are already stored in INT4"]',1,'Key outliers concentrate in fixed channels; value errors matter per token because values are mixed by the attention weights.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l2-07','mlsys','mlsys-l2','Time to first token (TTFT) is dominated by:','["Tokenizer speed","Decode memory bandwidth","Prefill compute (plus queueing)","All-reduce latency"]',2,'The first token comes after the whole prompt is prefilled, which is compute-bound and grows with prompt length.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l3-01','mlsys','mlsys-l3','Llama 2 7B (32 layers, 32 KV heads, head dim 128, BF16). KV cache per token?','["512 KiB","256 KiB","128 KiB","1 MiB"]',0,'2 * 32 * 32 * 128 * 2 B = 524,288 B = 512 KiB.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l3-02','mlsys','mlsys-l3','Llama 3 8B (32 layers, 8 KV heads, head dim 128, BF16) at 128K context. KV cache for one sequence?','["1 GiB","4 GiB","64 GiB","16 GiB"]',3,'128 KiB/token * 131,072 tokens = 16 GiB.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l3-03','mlsys','mlsys-l3','Training a 7B model on 2T tokens using 1,000 H100s (989 TFLOP/s BF16) at 40% MFU takes about:','["~6 hours","~2.5 days","~25 days","~8 months"]',1,'6 * 7e9 * 2e12 = 8.4e22 FLOPs; / (1000 * 989e12 * 0.4) = about 2.1e5 s, about 59 h.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l3-04','mlsys','mlsys-l3','Weight memory of a 70B model in NVFP4 (4.5 bits per weight including block scales)?','["35.0 GB","70 GB","~39.4 GB","140 GB"]',2,'70e9 * 4.5 / 8 = 39.375 GB.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l3-05','mlsys','mlsys-l3','An 8B model with INT4 weights (4 GB) decodes at batch 1 on 3.35 TB/s. Upper bound, ignoring KV?','["~837 tok/s","~419 tok/s","~209 tok/s","~1,675 tok/s"]',0,'3.35e12 / 4e9 = about 837 tokens/s. BF16 weights (16 GB) would give about 209.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l3-06','mlsys','mlsys-l3','Decode attention with 8 query heads per KV head (BF16 KV). Arithmetic intensity?','["~1 FLOP/B","~128 FLOP/B","~64 FLOP/B","~8 FLOP/B"]',3,'Each 2-byte KV element is used by 8 heads at 2 FLOPs each: 16 FLOPs / 2 B = 8 FLOP/B. Still deeply memory-bound.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-mlsys-l3-07','mlsys','mlsys-l3','Weights, gradients and Adam state in mixed precision for a 7B model need about:','["14 GB","112 GB","56 GB","28 GB"]',1,'16 B/param * 7e9 = 112 GB, before activations.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g4-01','gpu','gpu-g4','Online softmax: block 1 has scores {2, 4}, giving m = 4 and l = e^-2 + e^0 = 1.1353. Block 2 has the score {6}. What is the new l?','["1.135","2.135","1.154","3.000"]',2,'m'' = 6; l'' = 1.1353 * e^(4-6) + e^0 = 0.1536 + 1 = 1.1536. Check: e^-4 + e^-2 + e^0 = 0.0183 + 0.1353 + 1 = 1.1536.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g4-02','gpu','gpu-g4','FlashAttention''s HBM accesses scale as (N = sequence length, d = head dim, M = SRAM size):','["Theta(N^2 * d^2 / M)","Theta(N^2)","Theta(N * d)","Theta(N^2 * M / d)"]',0,'Standard attention is Theta(Nd + N^2); FlashAttention is Theta(N^2 d^2 / M), which is far smaller for typical d and M.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-gpu-g4-03','gpu','gpu-g4','With a causal mask, a FlashAttention kernel that skips fully masked blocks does about what fraction of the FLOPs of full attention?','["~1/4","The same","~3/4","~1/2"]',3,'Blocks above the diagonal are skipped; only diagonal blocks need element masks.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-01','soc','soc-fw','uint32_t *sr = (uint32_t *)0x40001000; while (!(*sr & READY)); compiled with -O2 hangs even though the hardware sets READY. Why?','["READY must be a signed constant","The compiler may load *sr once and loop on the cached value, because sr is not volatile","The hardware needs a DSB after every read","MMIO addresses cannot be cast from integers"]',1,'Without volatile the load is loop-invariant to the compiler. Declare it volatile uint32_t *.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-02','soc','soc-fw','Which statement about C volatile is TRUE?','["volatile inserts a hardware memory barrier","volatile makes increments atomic","Each volatile access in the source is performed, in order relative to other volatile accesses","volatile bypasses the CPU data cache"]',2,'volatile only constrains the compiler. Atomicity, barriers and cacheability come from atomics, barrier instructions and the MMU or bus attributes.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-03','soc','soc-fw','Which line clears bits 7:4 of reg and leaves the others unchanged?','["reg &= ~(0xFu << 4);","reg |= ~(0xFu << 4);","reg &= (0xFu << 4);","reg ^= (0xFu << 4);"]',0,'AND with the inverted mask clears only those bits. AND with the plain mask would keep only bits 7:4, and XOR would toggle them.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-04','soc','soc-fw','A little-endian CPU stores the 32-bit value 0x12345678 at address 0x100. Which byte is at 0x101?','["0x12","0x34","0x78","0x56"]',3,'Little-endian stores the least significant byte first: 0x100 = 78, 0x101 = 56, 0x102 = 34, 0x103 = 12.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-05','soc','soc-fw','sizeof(struct { char a; int b; short c; }) on a typical 32-bit ABI (4-byte int alignment)?','["7","12","10","8"]',1,'a@0, padding to 4, b@4, c@8, tail padding to a multiple of 4: 12.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-06','soc','soc-fw','What is x & (x - 1) for x = 0b1011_0000?','["0b1011_0001","0b0001_0000","0b1010_0000","0b1011_1111"]',2,'It clears the lowest set bit (bit 4). x & -x would isolate it (0b0001_0000).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-07','soc','soc-fw','Three periodic tasks under rate-monotonic scheduling have total utilization 0.85. The Liu-Layland bound says:','["Nothing conclusive: run response-time analysis","They are schedulable","They are unschedulable","They are schedulable only under round-robin"]',0,'The bound for n = 3 is 0.780. Above it the test is inconclusive, because the bound is sufficient, not necessary.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-08','soc','soc-fw','A device has DMA-written a received packet into a cacheable buffer on a non-coherent SoC. Before the CPU reads it, the driver must:','["Clean (write back) the buffer''s cache lines","Disable the data cache globally","Do nothing; DMA updates the cache","Invalidate the buffer''s cache lines"]',3,'Invalidating drops stale lines so the CPU reads from memory. Cleaning is for the TX direction, before a device reads.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-09','soc','soc-fw','A driver writes a descriptor to normal memory and then rings an MMIO doorbell. What guarantees the device sees the descriptor first?','["Declaring the descriptor volatile","A write barrier between the two (e.g., dma_wmb(), or writel() rather than writel_relaxed())","Writing the doorbell twice","Nothing; stores always complete in order"]',1,'volatile does not order normal-memory stores against device writes on weakly ordered CPUs; a barrier does.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-10','soc','soc-fw','Which Arm barrier waits until all earlier memory accesses have completed before continuing?','["DMB","ISB","DSB","WFI"]',2,'DMB only orders accesses, DSB waits for completion, and ISB flushes the pipeline.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-11','soc','soc-fw','On exception entry, how many words does a Cortex-M3/M4 (no FP context) push automatically?','["8","4","16","0"]',0,'R0-R3, R12, LR, PC and xPSR: 8 words.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-12','soc','soc-fw','UART at 115200 baud, 8N1. Maximum payload rate?','["14,400 B/s","115,200 B/s","12,800 B/s","11,520 B/s"]',3,'Each byte takes 1 start + 8 data + 1 stop = 10 bits; 115200/10 = 11,520 B/s.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-13','soc','soc-fw','An SPI bus at 10 MHz transfers 1 KiB with no gaps between bytes. How long does it take?','["102.4 us","819.2 us","1.024 ms","8.19 ms"]',1,'8,192 bits / 10e6 bits/s = 819.2 us.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-14','soc','soc-fw','A 48 MHz timer with a /48 prescaler must interrupt at 1 kHz. Which auto-reload value (counting 0..ARR) do you use?','["47","1000","999","47,999"]',2,'48 MHz / 48 = 1 MHz; 1 MHz / 1 kHz = 1,000 counts, so ARR = 999.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-15','soc','soc-fw','How was the 1997 Mars Pathfinder reset problem fixed?','["By enabling priority inheritance on the shared mutex","By disabling the watchdog","By raising the clock frequency","By replacing VxWorks with a cooperative scheduler"]',0,'A low-priority task holding the mutex was preempted by medium-priority tasks, which starved the high-priority bus task (priority inversion). Engineers uploaded a fix that turned on priority inheritance for that mutex.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-soc-fw-16','soc','soc-fw','Why do interrupt status registers usually use write-1-to-clear bits?','["So reads clear the bits automatically","Because writing 0 damages flip-flops","To save one address in the register map","So software can clear only the bits it handled without a read-modify-write race"]',3,'With read-modify-write, a bit set by hardware between the read and the write could be cleared unseen.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m1-01','rtl','rtl-m1','b and c start at 0, a = 1. After one posedge of always @(posedge clk) begin b = a; c = b; end, what are b and c?','["b = 1, c = 1","b = 0, c = 1","b = 1, c = 0","b = 0, c = 0"]',0,'Blocking assignments execute in order: b becomes 1, then c reads the new b. Both are 1 after one edge.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m1-02','rtl','rtl-m1','Same block written with nonblocking: b <= a; c <= b. b and c start at 0, a = 1. After one edge?','["b = 0, c = 0","b = 0, c = 1","b = 1, c = 1","b = 1, c = 0"]',3,'Both right-hand sides are sampled before any update: c gets the old b (0). This is a 2-stage shift register.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m1-03','rtl','rtl-m1','Which always_comb block infers a latch (sel is 2 bits)?','["y = 0; if (en) y = d;","y = en ? d : 1''b0;","case (sel) 2''d0: y = a; 2''d1: y = b; 2''d2: y = c; endcase","if (en) y = d; else y = 1''b0;"]',2,'sel = 3 is not covered and there is no default, so y must hold its value: a latch. The others assign y on every path.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m1-04','rtl','rtl-m1','An FSM has 10 states. How many state flops for binary and for one-hot encoding?','["4 and 10","4 and 4","10 and 4","3 and 10"]',0,'Binary needs ceil(log2 10) = 4 flops; one-hot needs one flop per state = 10.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m1-05','rtl','rtl-m1','An overlapping 1011 detector: minimum states for Mealy and for Moore?','["3 Mealy, 4 Moore","4 Mealy, 5 Moore","5 Mealy, 4 Moore","4 and 4"]',1,'Mealy tracks prefixes "", 1, 10, 101 and asserts on the final 1 (4 states). Moore needs an extra "detected" state whose output is 1 (5 states).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m1-06','rtl','rtl-m1','With posedge-only flops, which duty cycles can a divide-by-3 clock have?','["Any duty cycle","25% or 75%","Exactly 50%","33% or 67%"]',3,'The output can only change on rising edges, so it is high for 1 or 2 of 3 cycles. 50% needs a falling-edge flop (1.5 cycles high).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m1-07','rtl','rtl-m1','Why does an integrated clock gate latch the enable instead of ANDing en with clk directly?','["To synchronize en from another clock domain","To save area","To stop enable changes during the high phase from creating glitches or truncated pulses","To add one cycle of latency"]',2,'The latch is transparent only while clk is low, so the gating value is frozen during the high phase.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m1-08','rtl','rtl-m1','Flops plus clock tree in a block burn 60 mW of dynamic power. Clock gating idles them 75% of the time. Ideal saving?','["45 mW","60 mW","15 mW","30 mW"]',0,'Dynamic power scales with activity: 0.75 x 60 = 45 mW saved (ignoring ICG overhead and leakage).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m1-09','rtl','rtl-m1','Which reset style needs the clock to be running to reset the flop?','["Both","Neither","Asynchronous reset","Synchronous reset"]',3,'A synchronous reset is just data into D, so it takes effect only on a clock edge.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m2-01','rtl','rtl-m2','A writer sends a 120-word burst back to back at 200 MHz; the reader takes one word per cycle at 100 MHz. Minimum FIFO depth?','["120","30","60","90"]',2,'The burst lasts 120 / 200 MHz = 600 ns; the reader drains 600 ns x 100 MHz = 60 words. Depth = 120 - 60 = 60.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m2-02','rtl','rtl-m2','Writer: 100-word burst back to back at 80 MHz. Reader: 100 MHz clock but reads only every 2nd cycle. Minimum depth?','["38","50","63","20"]',0,'Burst time = 100 / 80 MHz = 1.25 us. Read rate = 50 M words/s, so 62.5 words drained. Depth = 100 - 62.5 = 37.5, round up to 38.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m2-03','rtl','rtl-m2','8-deep sync FIFO with 4-bit pointers: wr_ptr = 4''b1010, rd_ptr = 4''b0010. State?','["Neither","Pointer error","Empty","Full"]',3,'Lower 3 bits are equal (010) and the MSBs differ: the writer is one full lap ahead, so the FIFO is full.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m2-04','rtl','rtl-m2','req = 8''b1011_0100. What does grant = req & (~req + 1) give?','["8''b1000_0000","8''b0000_0100","8''b0011_0100","8''b0000_0001"]',1,'~req + 1 = 0100_1100; AND with req keeps only the lowest set bit, bit 2.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m2-05','rtl','rtl-m2','4-requester round-robin arbiter. Last grant went to requester 2. Requests are 4''b1011 (requesters 0, 1, 3). Next grant?','["Requester 1","Requester 2","Requester 3","Requester 0"]',2,'The search starts just after the last winner: 3 is requesting, so 3 wins before wrapping to 0.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m2-06','rtl','rtl-m2','Which of these breaks the valid/ready rules?','["The source changes data while valid is high and ready is low","Valid stays high for several cycles waiting for ready","Ready is high before valid arrives","Ready depends combinationally on valid"]',0,'Once valid is asserted, data must stay stable until the transfer (valid && ready). The others are legal.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m2-07','rtl','rtl-m2','A pipeline stage registers its ready output. How many data registers does it need to sustain one transfer per cycle?','["1","2","3","4"]',1,'Upstream sees ready one cycle late, so one extra word can arrive after the stall starts: the main register plus one skid register.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m2-08','rtl','rtl-m2','A credit-based link has an 8-cycle round trip (send to credit return) and moves one word per cycle. With 4 credits, the best throughput is:','["25%","100%","75%","50%"]',3,'Only 4 words can be in flight per 8-cycle round trip: 4/8 = 50%. Full rate needs at least 8 credits.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m2-09','rtl','rtl-m2','A 4-stage pipeline at 1 GHz with no stalls processes 100 items. Time from the first input to the last output?','["400 ns","100 ns","103 ns","104 ns"]',2,'The first result takes 4 cycles, then one per cycle: 4 + 99 = 103 cycles = 103 ns.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-01','rtl','rtl-m3','t_r = 1 ns, tau = 50 ps, T0 = 100 ps, f_clk = 1 GHz, f_data = 100 MHz. MTBF of the synchronizer is about:','["50 s","5000 s","0.5 s","5 s"]',0,'e^(1000/50) = e^20 = 4.85e8. Denominator = 1e-10 x 1e9 x 1e8 = 1e7. MTBF = 48.5 s: far too low for a product.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-02','rtl','rtl-m3','Same numbers, but a second flop adds 1 ns more resolution time (t_r = 2 ns). New MTBF is about:','["1e40 years","97 s","1 hour","750 years"]',3,'MTBF grows by e^(1000/50) = 4.85e8: 48.5 s x 4.85e8 = 2.35e10 s = about 750 years.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-03','rtl','rtl-m3','A one-cycle pulse at 500 MHz goes through a 2-flop synchronizer into a 100 MHz domain. What can go wrong?','["Only metastability, never a miss","Nothing, 2 flops are enough","The 2 ns pulse can fall between 10 ns sampling edges and be missed","The pulse is always seen twice"]',2,'The destination samples every 10 ns; a 2 ns pulse is missed most of the time. Stretch it, use a toggle synchronizer or a handshake.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-04','rtl','rtl-m3','Which multi-bit signal can be synchronized with one 2-flop synchronizer per bit?','["A Gray-coded counter that changes by one step per source clock","A 32-bit data bus","An FSM state in binary encoding","A binary counter"]',0,'Only one bit changes per step, so the destination sees either the old or the new value, never a mix.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-05','rtl','rtl-m3','Binary 1011 in Gray code?','["0111","1011","1101","1110"]',3,'1011 ^ 0101 = 1110.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-06','rtl','rtl-m3','Gray 1101 in binary?','["0110","1011","1001","1101"]',2,'b3 = 1; b2 = 1 ^ 1 = 0; b1 = 0 ^ 0 = 0; b0 = 0 ^ 1 = 1 -> 1001. Check: 1001 ^ 0100 = 1101.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-07','rtl','rtl-m3','8-deep async FIFO, 4-bit Gray pointers. In the write domain: wr_gray = 1101, synchronized rd_gray = 0001. State?','["Full","Neither","Cannot tell","Empty"]',0,'Invert the top two bits of rd_gray: 1101 equals wr_gray, so the FIFO is full (binary 1001 vs 0001: exactly 8 ahead).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-08','rtl','rtl-m3','In an async FIFO, the empty flag must be generated in which domain?','["Write domain","Read domain","Either","A third clock domain"]',1,'The reader uses empty, so it compares its own read pointer with the synchronized write pointer; full lives in the write domain.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-09','rtl','rtl-m3','A reset synchronizer makes which edge of reset synchronous?','["Both","Neither","Assertion","Deassertion"]',3,'Assertion stays asynchronous (works without a clock); deassertion is aligned to the clock so all flops leave reset together and recovery/removal is met.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-10','rtl','rtl-m3','Signals A and B each pass through their own 2-flop synchronizer and are then ANDed. The risk is:','["None if both are single bits","Higher MTBF","Reconvergence: A and B can arrive in different cycles and the AND is briefly wrong","Lower fmax only"]',2,'Each synchronizer can add an extra cycle independently. Synchronize one combined signal, or Gray-encode related bits.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-11','rtl','rtl-m3','Pulses arrive on consecutive source cycles at a toggle synchronizer feeding a slower domain. Result?','["Two toggles can cancel within one sampling window and pulses are lost","Metastability is guaranteed","The toggle flop overflows","Each pulse is counted"]',0,'Toggle synchronizers need pulses spaced by about 2-3 destination cycles; otherwise use a handshake or a FIFO.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-12','rtl','rtl-m3','Why do glitch-free clock muxes clock the final enable flop on the falling edge?','["To synchronize the select signal","To meet hold time","To halve power","So the enable changes only while that clock is low and never cuts a high pulse"]',3,'An AND-gated clock can only glitch if its enable changes while the clock is high.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m3-13','rtl','rtl-m3','How should the Gray-coded pointer bus of an async FIFO be constrained?','["No constraint is needed","set_false_path with nothing else","set_max_delay -datapath_only of about one clock period, so its bits cannot skew apart by a cycle","set_multicycle_path 2"]',2,'A bare false path lets bits arrive cycles apart, which breaks the one-bit-change property at the destination.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-01','rtl','rtl-m4','t_cq = 80 ps, t_logic = 620 ps, t_su = 50 ps, skew = 0, uncertainty = 50 ps. fmax?','["1.25 GHz","1.33 GHz","1.43 GHz","1.0 GHz"]',0,'T_min = 80 + 620 + 50 + 50 = 800 ps -> 1.25 GHz.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-02','rtl','rtl-m4','Same path, but the capture clock arrives 100 ps later than the launch clock (skew = +100 ps). fmax?','["2.0 GHz","1.11 GHz","1.25 GHz","1.43 GHz"]',3,'T_min = 800 - 100 = 700 ps -> 1.43 GHz. Positive skew helps setup (and hurts hold).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-03','rtl','rtl-m4','Same path, but the capture clock arrives 100 ps earlier (skew = -100 ps). fmax?','["1.43 GHz","0.9 GHz","1.11 GHz","1.25 GHz"]',2,'T_min = 800 + 100 = 900 ps -> 1.11 GHz.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-04','rtl','rtl-m4','Logic of 1.8 ns between flops (t_cq = t_su = 0.1 ns) is split by a new register into 1.2 ns + 0.6 ns. New fmax?','["714 MHz","909 MHz","1.25 GHz","500 MHz"]',0,'The slower stage sets the period: 0.1 + 1.2 + 0.1 = 1.4 ns -> 714 MHz. A balanced 0.9/0.9 split would give 1.1 ns (909 MHz); before the split it was 2.0 ns (500 MHz).');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-05','rtl','rtl-m4','t_cq = 60 ps, t_logic,min = 10 ps, t_hold = 40 ps, skew = +50 ps. Hold slack?','["0 ps","-20 ps","-70 ps","+20 ps"]',1,'Hold slack = (60 + 10) - (40 + 50) = -20 ps: a violation. Add at least 20 ps of delay on the data path.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-06','rtl','rtl-m4','The chip from the previous question fails hold. Will halving the clock frequency fix it?','["Only at high temperature","Only if skew is negative","Yes","No: hold does not depend on the clock period"]',3,'The hold check compares launch and capture on the same edge; the period never appears in it.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-07','rtl','rtl-m4','Setup at 1 GHz: t_cq = 100 ps, t_logic = 750 ps, t_su = 60 ps, uncertainty = 50 ps, skew = -20 ps. Setup slack?','["-20 ps","+40 ps","+20 ps","0 ps"]',2,'Required = 1000 - 20 - 60 - 50 = 870 ps; arrival = 100 + 750 = 850 ps; slack = +20 ps.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-08','rtl','rtl-m4','A path is relaxed with set_multicycle_path 3 -setup. Which -hold value restores the default hold check?','["2","3","0","1"]',0,'Moving setup by N cycles drags hold along by N-1; set_multicycle_path N-1 -hold (here 2) moves it back.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-09','rtl','rtl-m4','Cycle-to-cycle jitter mainly reduces margin on which check?','["Both equally","Neither","Hold","Setup"]',3,'Setup spans two consecutive edges; hold launches and captures on the same edge, so period jitter largely cancels.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-10','rtl','rtl-m4','In OCV setup analysis, which derates are pessimistic?','["All paths early","Launch clock and data early, capture clock late","Launch clock and data late, capture clock early","All paths late"]',2,'Setup is worst when data arrives late and the capture edge comes early; hold uses the opposite.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-11','rtl','rtl-m4','Launch and capture clocks share 400 ps of clock tree; OCV derates are +5% late, -5% early. CRPR credit?','["40 ps","80 ps","0 ps","20 ps"]',0,'The shared part was counted as 420 ps on one side and 380 ps on the other; it cannot be both: 40 ps is credited back.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-12','rtl','rtl-m4','Hold is usually signed off at which corner?','["Typical only","Slow process, high voltage","Slow process, low voltage","Fast process, high voltage"]',3,'Hold fails when data paths are fastest: the fast corner.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-13','rtl','rtl-m4','Which is a valid false path?','["Any path between two flops on the same clock","A path that fails timing by 10 ps","A path from a static configuration register written only while the block is idle","A path through an adder"]',2,'Quasi-static configuration is never timed functionally; failing paths must be fixed, not hidden.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-14','rtl','rtl-m4','y depends on a late-arriving select s and on slow logic f(a,b). Best restructuring?','["Compute f for both values of s in parallel and use s only on the final 2:1 mux","Lower the clock","Add a latch on s","Add s to the deepest gate"]',0,'Shannon expansion: the late signal passes through one mux level instead of the whole cone.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m4-15','rtl','rtl-m4','Retiming a design changes:','["The cycle latency at the I/O","Register positions (and maybe count) to balance stage delays","The clock frequency target","The function at the outputs"]',1,'Retiming moves registers across logic while keeping function and I/O latency.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m5-01','rtl','rtl-m5','a |=> b is equivalent to:','["a ##1 b","b |-> a","a |-> b","a |-> ##1 b"]',3,'Non-overlapping implication checks the consequent one clock after the antecedent.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m5-02','rtl','rtl-m5','Property req |-> ##[1:3] gnt. req is high at cycle 5 (and the property is otherwise clean). When must gnt be high to pass?','["Cycle 8 only","Cycle 5","At some cycle from 6 to 8","At every cycle from 6 to 8"]',2,'##[1:3] means 1 to 3 cycles later, and one match is enough.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m5-03','rtl','rtl-m5','What does disable iff (!rst_n) do in a concurrent assertion?','["Aborts and ignores evaluations while reset is active","Disables coverage","Makes the property vacuous forever","Delays the check by one cycle"]',0,'While the condition is true, attempts in progress are discarded, so reset behavior does not cause false failures.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m5-04','rtl','rtl-m5','Which UVM phase is the only one that consumes simulation time?','["report_phase","build_phase","connect_phase","run_phase"]',3,'run_phase (and its sub-phases) is a task; the others are functions.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m5-05','rtl','rtl-m5','In what order does build_phase run through the hierarchy?','["Alphabetical","Bottom-up","Top-down","Random"]',2,'Parents must build before children exist; connect_phase runs bottom-up.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m5-06','rtl','rtl-m5','Why create components with type_id::create instead of new()?','["The factory can substitute an overridden type without editing the env","new() is illegal in UVM","It automatically connects ports","It is faster"]',0,'Factory overrides let a test swap drivers, items or sequences.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m5-07','rtl','rtl-m5','A passive agent contains:','["Scoreboard only","Driver, sequencer and monitor","Driver and sequencer only","Monitor only"]',3,'Passive agents only observe; active agents add a sequencer and driver.');
INSERT OR IGNORE INTO quiz_questions(id,track,module,q,options,answer,explain) VALUES('z2-rtl-m5-08','rtl','rtl-m5','Code coverage is 100% but a bug escapes. Most likely gap?','["Simulator bug","Toggle coverage","Functional coverage: a feature combination or corner case was never exercised","Line coverage"]',2,'Code coverage shows that lines ran, not that the specified scenarios and crosses were hit and checked.');
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-001','Computer architecture','Walk me through a classic 5-stage pipeline. What are the three kinds of hazards and how is each handled?','**Stages:** IF → ID (decode + register read) → EX (ALU / address calc) → MEM → WB. Each stage is separated by pipeline registers; ideal CPI = 1, cycle time set by the slowest stage plus register overhead.

**Hazards**
- **Structural:** two instructions need the same resource in one cycle (e.g., a single unified memory port for IF and MEM). Fix: duplicate resources (split I$/D$), more register-file ports, or stall.
- **Data:** RAW is the real one in an in-order pipe (WAR/WAW appear with OoO or multi-cycle units).
  - Forwarding/bypassing EX→EX and MEM→EX removes most stalls.
  - **Load-use** still costs 1 bubble: `lw r1,0(r2); add r3,r1,r4` → hazard unit detects `ID/EX.MemRead && ID/EX.rd == IF/ID.rs`, freezes PC and IF/ID, injects a NOP.
  - Compiler scheduling can fill the slot.
- **Control:** the branch outcome/target is unknown until EX (or ID if you move the compare). Options: stall, predict not-taken and flush on mispredict, static/dynamic prediction, delay slots (historic MIPS). Penalty = number of stages between fetch and resolution.

**Numbers interviewers like:** CPI = 1 + (load-use frequency × 1) + (branch frequency × mispredict rate × penalty). E.g., 20% branches, 10% mispredict, 3-cycle penalty → +0.06 CPI.

**Pitfalls:** saying forwarding solves load-use; forgetting that writes to the register file happen in the first half of the cycle and reads in the second (so WB→ID needs no forwarding in the textbook design).

**Follow-ups:** How does deepening the pipeline affect branch penalty and power? Draw the forwarding mux control logic.','["Pipelining","Hazards"]','["structural hazard","data hazard","control hazard","forwarding","stall","flush"]','Easy','["NVIDIA","Intel","AMD","Qualcomm","Apple"]','both','arch','arch-p3','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-002','Computer architecture','Explain how an out-of-order core works: register renaming, reservation stations / issue queue, and the reorder buffer. How are precise exceptions preserved?','**Goal:** execute instructions as soon as their operands are ready, not in program order, while keeping the architectural state as if execution were in order.

**Front end:** fetch/decode in order → **rename**: map architectural registers to physical registers through a rename table (RAT); every destination gets a fresh physical register from a free list. This removes WAR/WAW (false) dependences; only true RAW remains.

**Dispatch:** each instruction gets (1) an entry in the issue queue / reservation stations, which wait for source tags to be broadcast, and (2) an entry in the **reorder buffer (ROB)** in program order.

**Issue/execute:** wakeup + select logic picks ready instructions (oldest-first typically); results are broadcast on a common data bus / bypass network, waking up dependents.

**Commit (retire):** in program order from the ROB head. Only at commit does the instruction update architectural state (the committed RAT, store buffer → cache). The previous physical mapping of the destination is freed.

**Precise exceptions / mispredicts:** an instruction that faults is marked in the ROB; when it reaches the head, everything younger is flushed, the RAT is restored (from a checkpoint or by walking the ROB), and the handler starts. Branch mispredicts usually recover earlier using RAT checkpoints taken at branches.

**Tomasulo (original IBM 360/91):** reservation stations hold values/tags, CDB broadcast, no ROB → imprecise exceptions. Modern = Tomasulo + ROB + physical register file (MIPS R10K / Alpha 21264 style) or the data-in-ROB style (P6).

**Memory ops:** load/store queue; loads may execute before older stores with unknown addresses (memory dependence prediction); a later-detected violation forces a replay/flush.

**Pitfalls:** saying renaming removes RAW; forgetting stores can only write the cache at commit.

**Follow-ups:** What limits ROB size (wakeup/select timing, register file ports, power)? How would you handle a load that hits a store-buffer entry with partial overlap?','["Out-of-order execution"]','["Tomasulo","register renaming","reorder buffer","precise exceptions","physical register file"]','Medium','["Apple","Intel","AMD","Qualcomm"]','both','arch','arch-p4','https://www.glassdoor.ca/Interview/Apple-Interview-E1138-RVW3558946.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-003','Computer architecture','How does a branch predictor work? Compare a 2-bit saturating counter, gshare, and a tournament / TAGE-style predictor. What is a BTB?','- **Direction vs target:** the direction predictor says taken/not taken; the **BTB** (branch target buffer, indexed by PC) supplies the target at fetch so the front end doesn''t wait for decode. A **return address stack** predicts returns; indirect predictors handle `jmp reg`.
- **1-bit:** mispredicts twice per loop exit/entry. **2-bit saturating counter** (strongly/weakly taken/not taken) tolerates one anomaly → loop branch mispredicts once per loop.
- **Local history** (per-branch pattern table) catches periodic patterns like TTN.
- **gshare:** index = PC XOR global history register; captures correlation between branches with one table and reduces aliasing vs simple concatenation.
- **Tournament (Alpha 21264):** a chooser picks local vs global per branch.
- **TAGE:** several tagged tables indexed with geometrically increasing history lengths; the longest-history hit provides the prediction. State of the art together with perceptron predictors.
- **Cost of a miss:** penalty ≈ cycles from fetch to resolve (15-20 on wide modern cores), times the number of instructions in flight that are discarded → width × depth makes accuracy critical.

**Pitfalls:** confusing BTB with the direction predictor; ignoring aliasing.

**Follow-ups:** How do you update history speculatively and repair it on a mispredict? What does a GPU do instead (SIMT divergence handling, no deep speculation)?','["Branch prediction"]','["2-bit counter","gshare","global history","BTB","return address stack","TAGE"]','Medium','["Intel","AMD","Apple","NVIDIA"]','both','arch','arch-p4','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-004','Computer architecture','Compute AMAT for a two-level cache: L1 hit time 1 cycle, L1 miss rate 5%, L2 hit time 10 cycles, L2 local miss rate 20%, memory latency 200 cycles. How would you reduce it?','**AMAT = HitTime_L1 + MissRate_L1 × (HitTime_L2 + LocalMissRate_L2 × MemLatency)**
= 1 + 0.05 × (10 + 0.2 × 200) = 1 + 0.05 × 50 = **3.5 cycles**.

Global L2 miss rate = 0.05 × 0.2 = 1% of all accesses go to DRAM.

**Reduce each term:**
- Hit time: smaller/lower-associativity L1, way prediction, VIPT so TLB lookup is parallel.
- Miss rate: bigger caches, higher associativity, better replacement, larger blocks (until pollution / conflict), prefetching, compiler blocking/tiling.
- Miss penalty: L2/L3, critical-word-first / early restart, non-blocking caches with MSHRs (overlap misses — then AMAT under-estimates benefit), victim caches, write buffers.

**3 Cs:** compulsory, capacity, conflict (+ coherence in multicore). Know which knob hits which C.

**Pitfalls:** multiplying the L2 *global* miss rate inside the parentheses; forgetting that with memory-level parallelism, AMAT is not the whole story.

**Follow-ups:** If I double block size, what happens to each C? How does a non-blocking cache change the effective penalty?','["Caches"]','["AMAT","local vs global miss rate","miss penalty"]','Easy','["NVIDIA","Intel","Qualcomm","Micron","AMD"]','both','arch','arch-p5','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-005','Computer architecture','Write-back vs write-through caches, and write-allocate vs no-write-allocate. When would you choose each?','- **Write-through:** every store updates the next level. Simple coherence/recovery, no dirty state, but high bandwidth; usually paired with a **write buffer** and **no-write-allocate**. Good for small L1s in front of an inclusive L2 (some GPUs'' L1s), or when ECC/parity at L1 is only parity (data always also lives below).
- **Write-back:** stores update only the cache line and set a **dirty bit**; written to the next level on eviction. Saves bandwidth and energy for repeated writes; needs dirty eviction path (write-back buffer), more complex coherence. Usually paired with **write-allocate** (fetch the line on a store miss; read-for-ownership in coherent systems).
- **No-write-allocate** helps streaming writes that won''t be reread (memset/memcpy destination); modern CPUs use non-temporal stores or full-line write detection to avoid the RFO.
write-through L1 can get away with parity and refetch.

**Pitfalls:** assuming write-through means the core waits for memory (the write buffer hides it until it fills).

**Follow-ups:** How do you verify a write-back 4-way set-associative cache? What happens on a dirty eviction that collides with an incoming miss to the same set?','["Caches"]','["write-back","write-through","write-allocate","dirty bit","write buffer"]','Medium','["AMD","Qualcomm","Samsung","Micron"]','both','arch','arch-p5','https://www.glassdoor.es/Entrevista/Ampere-Computing-Entrevista-E1948319-RVW95304775.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-006','Computer architecture','Given a 32 KB, 8-way set-associative cache with 64 B lines and 48-bit physical addresses, how many tag, index and offset bits? What''s the total tag-store size?','- Lines = 32 KB / 64 B = 512. Sets = 512 / 8 = **64**.
- Offset = log2(64) = **6 bits**; index = log2(64) = **6 bits**; tag = 48 − 6 − 6 = **36 bits**.
- Per line metadata: 36 tag + valid + dirty (if WB) + replacement state (pseudo-LRU for 8 ways ≈ 7 bits per set) + coherence state (2-3 bits). Tag store ≈ 512 × (36 + 1 + 1 + 2) ≈ 20,480 bits ≈ 2.5 KB plus 64 × 7 PLRU bits → about 8% overhead.
- Note 6 index + 6 offset = 12 bits = 4 KB page offset → this L1 can be **VIPT without aliasing** (classic reason L1 = 8-way × 4 KB = 32 KB).

**Pitfalls:** using byte count instead of line count for sets; forgetting ECC bits in the data array if asked for total SRAM.

**Follow-ups:** Make it 64 KB with the same 4 KB page — what breaks and how do you fix it (more ways, page coloring, alias detection)? How does the answer change for a fully associative cache?','["Caches"]','["tag/index/offset","set associativity","tag overhead"]','Medium','["Qualcomm","NVIDIA","Intel"]','both','arch','arch-p5','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-007','Computer architecture','What is a VIPT cache, why is it used for L1, and what is the synonym (aliasing) problem?','- **PIPT:** translate first, then index → TLB latency in series with cache access.
- **VIVT:** fast, but homonyms (same VA, different processes) need ASIDs/flush and synonyms (two VAs → same PA) can exist in two lines → coherence nightmare.
- **VIPT:** index with **untranslated page-offset bits** while the TLB translates in parallel, then compare the **physical tag**. Hit time ≈ max(TLB, SRAM read) instead of the sum.
- **Constraint:** if index + offset bits ≤ page-offset bits (12 for 4 KB), index bits are identical in VA and PA → no synonyms. Hence size ≤ page size × associativity (4 KB × 8 = 32 KB, 4 KB × 12 = 48 KB).
- If bigger: synonyms may map to different sets. Fixes: higher associativity, OS page coloring, hardware alias detection (check other candidate sets on a miss, or rely on an inclusive L2 that tracks which L1 set holds the line), larger pages.

**Pitfalls:** saying VIPT has no aliasing in general — only when the size constraint holds.

**Follow-ups:** Given a configuration (size, ways, page size), can it be VIPT? How do huge pages help?','["Caches","Virtual memory"]','["VIPT","VIVT","PIPT","synonyms","homonyms","TLB"]','Hard','["Apple","Intel","AMD","Qualcomm"]','both','arch','arch-p5','https://fr.glassdoor.ca/Entretien/Apple-Entretien-E1138-RVW4976907.htm',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-008','Computer architecture','Explain the MESI cache coherence protocol. Walk through a read miss and a write to a line that another core holds in Shared.','**States:** Modified (dirty, exclusive), Exclusive (clean, only copy), Shared (clean, maybe others), Invalid.

**Read miss (core A):** issue BusRd/GetS. If no other copy → load in **E** (so a later write is silent). If others have S/E → all go/stay **S**. If someone has **M** → it supplies data (cache-to-cache) and writes back (MESI) or keeps ownership in **O** (MOESI), then both S.

**Write to S line (core A):** must get exclusive permission: send BusUpgr/GetM (invalidate); other sharers go **I**; A goes **M**. Write miss = BusRdX (read-for-ownership).

**E''s purpose:** avoids an upgrade transaction for private data (common case).

**Snooping vs directory:** snooping broadcasts on a bus/ring — simple but doesn''t scale; directory (at LLC/home node) tracks sharers with bit-vectors → point-to-point messages, scales to many cores/chiplets. Inclusive LLC can act as a snoop filter.

**Issues interviewers probe:** false sharing (two variables in one line ping-pong), transient states and races (two cores upgrading simultaneously → serialized at the bus/directory), coherence vs consistency (coherence = single location ordering; consistency = ordering across locations).

**GPU note:** GPUs typically use software-managed/relaxed coherence (L1 write-through or invalidate on sync/acquire), not MESI on L1.

**Follow-ups:** Why add O (MOESI) or F (MESIF)? How does a directory handle an eviction of a line in S silently?','["Cache coherence"]','["MESI","MOESI","snooping","directory","invalidation","RFO"]','Medium','["NVIDIA","Intel","AMD","Apple","Qualcomm"]','both','arch','arch-x2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-009','Computer architecture','What is a memory consistency model? Compare sequential consistency, TSO (x86) and relaxed models (Arm/RISC-V). Show a litmus test that distinguishes them.','- **Consistency** defines the legal orderings of loads/stores to *different* addresses as seen by other threads (coherence only covers one address).
- **SC:** results as if all operations were interleaved in some global order respecting each thread''s program order.
- **TSO (x86, SPARC):** allows **store → load** reordering (because of the store buffer); every other order preserved; stores seen in the same order by all.
- **Relaxed (Arm, RISC-V RVWMO, GPUs/PTX):** loads and stores can reorder unless dependencies or fences/acquire-release enforce it.

**Store-buffering litmus (Dekker):**
```
T0: x = 1; r1 = y;      T1: y = 1; r2 = x;
```
`r1 == 0 && r2 == 0` is **forbidden under SC**, **allowed under TSO** (both stores sit in store buffers). Fix: `MFENCE` / full fence between store and load.

**Message passing:** `T0: data=1; flag=1;  T1: while(!flag); r=data;` → safe under TSO, can see r=0 on Arm without release/acquire (`stlr`/`ldar`) or `dmb`.

**HW implementation:** OoO cores speculatively execute loads early and **snoop the load queue** on invalidations to squash if a violation would be visible (that''s how x86 gets TSO with aggressive OoO).

**Follow-ups:** How does a GPU''s scoped memory model (CTA/GPU/system scope) differ? What does a fence cost in hardware?','["Memory consistency"]','["sequential consistency","TSO","store buffer","fences","acquire/release"]','Hard','["Apple","AMD","Intel","NVIDIA"]','fulltime','arch','arch-x2','https://www.glassdoor.ca/Interview/Apple-Interview-E1138-RVW3558946.htm',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-010','Computer architecture','Explain virtual memory translation: page tables, TLB, page walk and page faults. How many memory accesses does a TLB miss cost on x86-64?','- **VA → PA** via a per-process page table; page offset passes through; virtual page number translated.
- **x86-64 4-level** (48-bit VA): PML4 → PDPT → PD → PT, 9 bits each + 12 offset. A TLB miss = **4 dependent memory accesses** (5 with LA57), mitigated by page-walk caches (caching upper levels) and the data caches holding PTEs. Under virtualization (nested paging) worst case 24 accesses.
- **TLB:** small, highly associative cache of translations (L1 DTLB ~64 entries, L2 STLB ~1-2K). **TLB reach** = entries × page size → huge pages (2 MB/1 GB) increase reach dramatically, critical for big ML/graph workloads.
- **Page fault:** PTE not present → exception → OS allocates/loads the page, updates PTE, restarts instruction. Protection faults handled similarly (copy-on-write).
- **Context switch:** ASID/PCID tags avoid flushing the TLB; TLB shootdowns (IPIs) when unmapping on multicore.
- **GPU angle:** GPUs have their own MMU/TLBs, UVM page migration on fault (NVIDIA Unified Memory), and large pages (64 KB / 2 MB) because thousands of threads stress the TLB.

**Pitfalls:** saying a page fault means "TLB miss"; confusing TLB miss (hardware walk) and page fault (OS).

**Follow-ups:** Design a TLB for an accelerator that streams huge tensors. What''s the cost of a TLB shootdown?','["Virtual memory","TLB"]','["page table walk","TLB","multilevel page table","huge pages","page fault","MMU"]','Medium','["Intel","AMD","NVIDIA","Apple"]','both','os','os-u4','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-011','Computer architecture','How does DRAM work at the device level, and how do HBM and DDR differ? Why is HBM used for AI accelerators?','**Organization:** channel → rank → bank group → bank → rows × columns. A cell is 1 transistor + 1 capacitor. **ACTIVATE** opens a row: charge-sharing with the bitline, sense amplifiers amplify and latch the whole row (~1-2 KB per chip, 8 KB per rank) into the **row buffer**; **READ/WRITE** select columns (bursts); **PRECHARGE** closes the row and equalizes bitlines.

**Key timings:** tRCD (ACT→RD), CL/tCAS (RD→data), tRP (precharge), tRAS (min row-open time), tRC = tRAS + tRP, tFAW/tRRD (activation power limits), tREFI/tRFC (refresh).

**DDR5 vs HBM3/3E:**
| | DDR5 DIMM | HBM3E stack |
|---|---|---|
| Interface | 64-bit (2×32 sub-channels) | 1024-bit (16 channels / 32 pseudo-channels) |
| Per-pin rate | ~4.8-8 Gb/s | ~8-9.6 Gb/s |
| BW | ~40-60 GB/s per DIMM | ~1-1.2 TB/s per stack |
| Packaging | PCB | 8-12 high stack with TSVs on a silicon interposer next to the GPU (2.5D, CoWoS) |

**Why HBM for AI:** LLM inference/training is bandwidth-bound; HBM gives an order of magnitude more bandwidth per package at lower energy per bit (~3-4 pJ/bit vs ~15+ for off-package DDR) due to short wires. Costs: capacity per stack (24-36 GB), price, thermal, interposer yield, supply (SK hynix/Samsung/Micron).

**Pitfalls:** mixing bandwidth and latency — HBM latency isn''t lower than DDR.

**Follow-ups:** What limits HBM capacity? What''s the role of the HBM base (logic) die, and how could it host PIM (e.g., Samsung HBM-PIM)?','["DRAM","HBM"]','["1T1C cell","sense amplifier","row buffer","channel/rank/bank","HBM stacking","TSV","bandwidth per pin"]','Medium','["Micron","SK hynix","Samsung","NVIDIA","AMD"]','both','arch','arch-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-012','Computer architecture','What is prefetching? Describe next-line, stride and stream prefetchers and how you would evaluate one (accuracy, coverage, timeliness).','- **Next-line:** on a miss to line X, fetch X+1. Cheap, good for sequential code/data.
- **Stride (PC-based):** a table indexed by load PC stores last address + stride + confidence; once stable, prefetch addr + k×stride (k = prefetch distance).
- **Stream buffers / stream prefetchers:** detect ascending/descending miss streams within a page; keep several streams in flight.
- **Advanced:** spatial (SMS, footprint), temporal/correlation (Markov, ISB), and software prefetch instructions.
- **Metrics:** *Accuracy* = useful prefetches / issued; *Coverage* = misses eliminated / original misses; *Timeliness* = arrived before demand (too late = partial benefit, too early = evicted). Plus bandwidth overhead and **pollution**.
- **Throttle** based on accuracy and memory bandwidth (feedback-directed prefetching). Prefetch into L2 vs L1 to limit pollution.
- **Page boundaries:** physical prefetchers usually stop at 4 KB pages (next page may not be contiguous).
- **Accelerators:** with known access patterns (tensors), explicit DMA/double-buffering replaces speculative prefetch.

**Follow-ups:** How does prefetching interact with DRAM row-buffer locality? When does a prefetcher hurt performance?','["Prefetching"]','["stride prefetcher","stream buffer","accuracy","coverage","timeliness","cache pollution"]','Medium','["Intel","AMD","Apple","Qualcomm"]','both','arch','arch-p5','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-013','Computer architecture','How does a GPU execute code (SIMT)? Explain warps, occupancy, latency hiding and warp divergence.','- **Hierarchy (NVIDIA):** grid → thread blocks (CTAs) → warps of 32 threads. Each block runs on one SM; an SM holds many warps (e.g., up to 48-64 resident) and several warp schedulers that issue one instruction per warp per cycle.
- **SIMT:** all 32 threads of a warp execute the same instruction on different data, with a per-thread active mask. (AMD: wavefronts of 32/64.)
- **Latency hiding:** no OoO or big caches per thread; instead, switch to another ready warp every cycle (zero-cost because each warp has its own registers). Need enough warps × ILP to cover memory latency (~400-800 cycles). Little''s law: in-flight requests = bandwidth × latency.
- **Occupancy** = resident warps / max warps, limited by registers per thread, shared memory per block, and block size. Higher isn''t always better (register spills, cache thrash).
- **Divergence:** if threads of one warp take different branches, both paths execute serially with masks; reconvergence via a SIMT stack or (Volta+) per-thread PCs with convergence barriers. Cost up to 2x for an if/else; divergence across warps is free.
- **Memory coalescing:** a warp''s 32 accesses merged into as few 32 B sectors / 128 B lines as possible; strided or random access wastes bandwidth.
- **Tensor cores:** warp-level matrix-multiply-accumulate units (mma / wgmma) that dominate ML throughput.

**Follow-ups:** How would you restructure a kernel with heavy divergence? Why does a GPU have a huge register file (e.g., 256 KB/SM)?','["GPUs","SIMT"]','["warp","SM","occupancy","latency hiding","divergence","reconvergence","register file"]','Medium','["NVIDIA","AMD","Google","Meta"]','both','gpu','gpu-g1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-014','Computer architecture','What are shared-memory bank conflicts on a GPU and how do you avoid them? What is memory coalescing?','- **Shared memory** = on-SM scratchpad split into **32 banks**, each 4 B wide; successive 4 B words go to successive banks. A warp''s access is conflict-free if each thread hits a different bank (or the same word → broadcast).
- **Conflict:** k threads hit different addresses in the same bank → access is serialized k ways.
- **Classic case:** a 32×32 float tile read by column: `tile[threadIdx.x][c]` → stride 32 words → all threads in bank c → 32-way conflict.
- **Fix:** pad: `__shared__ float tile[32][33];` → stride 33 → banks all distinct. Or swizzle the index (XOR layout, as in CUTLASS/FlashAttention), or change the access mapping.
- **Coalescing (global memory):** threads in a warp should access consecutive addresses so the 32 requests fold into four 32-byte sectors (one 128-byte line) for 4 B elements; AoS → SoA conversion is the textbook fix.
- **Transpose kernel** = the canonical interview problem combining both: read coalesced into shared memory, write coalesced out, pad to avoid conflicts.

**Follow-ups:** What''s the bank conflict behavior for 8-byte (double) accesses? How do swizzled layouts avoid padding waste?','["GPUs"]','["shared memory banks","bank conflict","padding","coalescing","transpose"]','Medium','["NVIDIA","AMD"]','both','gpu','gpu-g2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-015','Computer architecture','What is the difference between SRAM and DRAM, and why are caches built from SRAM?','| | SRAM | DRAM |
|---|---|---|
| Cell | 6T cross-coupled inverters (+2 access) | 1 transistor + 1 capacitor |
| Density | ~6x lower (larger cell, ~0.02-0.03 µm² at 3-5 nm) | high, process-optimized |
| Retention | static while powered | leaks → refresh every 32-64 ms |
| Read | non-destructive, fast (~1 ns) | destructive charge sharing → restore; ~15-50 ns |
| Process | same CMOS logic process | special DRAM process (deep trench/stacked capacitors) |

**Why caches use SRAM:** speed (single-cycle-ish L1), logic-compatible process (on-die), no refresh, random access. eDRAM used in some LLCs (IBM POWER, Intel Crystal Well) trading speed for density.

**Trend:** SRAM scaling has stalled (N3 vs N5 bitcell almost the same), which pushes chiplets/3D cache (AMD V-Cache) and interest in near/in-memory compute.

**Follow-ups:** Draw a 6T cell and explain read stability vs writability (cell ratio, pull-up ratio). Why is a DRAM read destructive?','["Memory technology"]','["6T SRAM","1T1C DRAM","refresh","density","latency","destructive read"]','Easy','["Qualcomm","Micron","Intel","Samsung"]','both','arch','arch-p5','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-016','Computer architecture','Superscalar vs VLIW vs SIMD/vector vs SIMT — compare them. Where does each spend its hardware complexity?','- **Superscalar OoO:** hardware finds ILP dynamically (rename, wakeup/select, ROB). Complexity and power in the scheduler; binary compatible; great for irregular code.
- **VLIW:** compiler packs independent ops into a long instruction word; hardware simple, but static scheduling suffers from unpredictable latency (cache misses), code bloat, binary compatibility issues. Thrives in DSPs (Qualcomm Hexagon) and some accelerators (TPU cores are VLIW-ish).
- **SIMD (AVX, NEON):** one instruction on a fixed-width vector; programmer/compiler vectorizes; masks for control flow.
- **Vector (RVV, SVE):** vector-length agnostic, strided/gather, chaining; good for long regular loops.
- **SIMT (GPU):** scalar per-thread programming model, hardware groups threads into warps; handles divergence with masks; hides latency with multithreading.
- **Accelerators (Tenstorrent, TPU):** many simple cores/tiles with explicit data movement, compiler-heavy.

**Follow-ups:** Why did VLIW fail for general-purpose (Itanium) but succeed in DSPs? Where would you put a PIM unit in this taxonomy?','["Parallelism"]','["ILP","DLP","TLP","VLIW","SIMD","vector","SIMT"]','Medium','["Qualcomm","Google","NVIDIA","Tenstorrent"]','both','arch','arch-p4','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-017','Computer architecture','Explain Amdahl''s law and Gustafson''s law. If 90% of a workload is parallelizable, what''s the max speedup on 16 cores and on infinite cores?','- **Amdahl:** Speedup = 1 / ((1 − p) + p/N). p = 0.9, N = 16 → 1 / (0.1 + 0.05625) = **6.4x**. N → ∞ → 1/0.1 = **10x**.
- **Gustafson (scaled speedup):** with a problem that grows with N, S = (1 − p) + p·N = 0.1 + 0.9 × 16 = 14.5x. Reality for big ML training: the batch/model grows with machine size.
- **Applied to accelerators:** accelerating only the GEMMs (e.g., 80% of time) by 100x gives 1/(0.2 + 0.008) ≈ 4.8x — the "other" ops (softmax, layernorm, data movement, host overhead) dominate → why fusion and on-chip non-GEMM support matter.
- Same logic applies to PIM: offloaded fraction and the data-movement cost of the rest determine the end-to-end win.

**Follow-ups:** How do communication overheads change the model (add a term growing with N)? How would you measure p in practice?','["Performance"]','["Amdahl''s law","Gustafson''s law","speedup","serial fraction"]','Medium','["NVIDIA","Intel","Cerebras","Meta"]','both','arch','arch-x2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-018','Computer architecture','What are the main components of dynamic and static power in a chip, and what techniques reduce each?','- **Dynamic:** P = α·C·V²·f (+ short-circuit power). Reduce α (clock gating, operand isolation, data encoding), C (smaller/shorter wires, data locality — moving data costs far more than computing on it), V (DVFS; V² is the big lever), f.
- **Static (leakage):** subthreshold + gate leakage, exponential in temperature and −Vt. Reduce with power gating (header/footer sleep transistors, state retention flops), multi-Vt cells (HVT off critical paths), body biasing, lower voltage in retention.
- **Architectural:** dark silicon, specialization (accelerators → energy/op 10-100x lower), near-memory compute (DRAM access ~ 10-100 pJ/word vs a 16-bit MAC < 1 pJ).
- **Energy numbers worth knowing (Horowitz, 45 nm):** 32-bit add 0.1 pJ, 32-bit FP mult 3.7 pJ, 32-bit SRAM read (8 KB) 5 pJ, 32-bit DRAM read 640 pJ.

**Follow-ups:** What''s the cost of power gating (wake-up latency, rush current, retention)? Why is "race to idle" sometimes better than DVFS?','["Power"]','["dynamic power","leakage","DVFS","clock gating","power gating","multi-Vt"]','Medium','["Apple","Qualcomm","NVIDIA","Intel"]','both','arch','arch-p1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-019','Computer architecture','How do you design an interconnect / network-on-chip for a many-core or chiplet accelerator? Compare bus, crossbar, ring and mesh.','| Topology | Pros | Cons |
|---|---|---|
| Bus | simple, broadcast for snooping | doesn''t scale |
| Crossbar | full bandwidth, 1 hop | O(N²) area/wires |
| Ring | simple routers, ordering | latency O(N), limited bisection |
| 2D mesh/torus | scales, regular layout (Tenstorrent, Cerebras wafer) | multi-hop latency, deadlock care |

- **Metrics:** latency (hops × router delay + serialization), bisection bandwidth, area/power per router, QoS.
- **Routing:** dimension-order (XY) is deadlock-free on a mesh; adaptive routing needs escape VCs. **Protocol deadlock** avoided with separate virtual networks for request/response.
- **Flow control:** wormhole + credit-based virtual channels.
- **Chiplets:** die-to-die links (UCIe, AMD Infinity Fabric) add latency/energy (~0.5 pJ/bit) — place traffic-heavy agents on the same die.
- **For ML:** collective communication patterns (all-reduce, multicast of weights) — hardware multicast and reduction in the NoC help (Cerebras/Tenstorrent style dataflow).

**Follow-ups:** Prove XY routing is deadlock-free. How would you support multicast on a mesh?','["Interconnect","NoC"]','["mesh","ring","crossbar","bisection bandwidth","deadlock","virtual channels","chiplets","UCIe"]','Hard','["Tenstorrent","Cerebras","AMD","NVIDIA","Intel"]','fulltime','arch','arch-x2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-arch-020','Computer architecture','What''s the difference between latency and bandwidth bound? Use Little''s law to compute how many outstanding memory requests a core needs to saturate memory bandwidth.','**Little''s law:** concurrency = throughput × latency.

Example: 100 GB/s of DRAM bandwidth, 100 ns loaded latency, 64 B lines → needed in-flight requests = (100e9 B/s × 100e-9 s) / 64 B = 10,000 B / 64 ≈ **156 outstanding lines**.

A single core with ~16-24 L1 MSHRs + L2 prefetchers can''t do it alone → need many cores, prefetchers, or a GPU with thousands of threads (HBM at 3 TB/s × ~500 ns → ~23k lines in flight — that''s why GPUs have huge numbers of warps).

- **Latency bound:** dependent pointer chasing, each miss waits for the previous one; more bandwidth doesn''t help.
- **Bandwidth bound:** independent streaming; limited by pins/channels.

**Follow-ups:** How do MSHRs merge secondary misses? How does this motivate PIM (avoid moving data at all)?','["Performance","Memory-level parallelism"]','["Little''s law","MSHR","memory-level parallelism","bandwidth-delay product"]','Medium','["NVIDIA","Google","Micron","AMD"]','both','arch','arch-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-mem-001','Memory systems & PIM/CIM','Explain row-buffer hits, misses and conflicts in DRAM. How do open-page vs closed-page policies and FR-FCFS scheduling exploit them?','- **Hit:** row already open → only CL (~14 ns).
- **Closed/empty:** bank precharged → tRCD + CL (~28 ns).
- **Conflict:** different row open → tRP + tRCD + CL (~42 ns) and the bank is busy longer.
- **Open-page:** leave the row open after access — wins with locality (streaming, single-threaded). **Closed-page:** precharge right after — wins with random access / many threads (reduces conflict cost). Adaptive/timeout policies in between.
- **FR-FCFS:** prioritize ready row hits first, then oldest. Maximizes throughput but can starve threads with low locality → fairness schedulers (PAR-BS, ATLAS, TCM).
- **Address mapping:** interleave consecutive lines across channels/banks for parallelism, but keep some columns in the same row for hits; XOR-based bank hashing reduces pathological conflicts.
- **Write handling:** buffer writes and drain in batches (bus turnaround tWTR).

**Follow-ups:** How does the controller''s address mapping affect a PIM design that needs operands in the same row/subarray? What''s the cost of tFAW for an accelerator that activates many banks at once?','["DRAM","Memory controller"]','["row buffer hit","row conflict","open-page policy","closed-page policy","FR-FCFS","address mapping"]','Medium','["Micron","SK hynix","Samsung","AMD","Intel"]','both','arch','arch-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-mem-002','Memory systems & PIM/CIM','Why is a DRAM read destructive, and why does DRAM need refresh? What does refresh cost and how is it mitigated?','- **Destructive read:** bitline is precharged to VDD/2; opening the wordline shares the small cell charge (~10-20 fF) with the much larger bitline capacitance → a small ΔV (~100 mV). The cross-coupled **sense amplifier** amplifies to full rail, which also **writes the value back** (restore). Until restore finishes, the cell''s original charge is gone → tRAS includes restore time.
- **Refresh:** capacitors leak (junction leakage, GIDL, subthreshold), so each row must be re-sensed within the retention time — standard 64 ms (32 ms above 85 °C). The controller issues REF every **tREFI = 7.8 µs** (3.9 µs DDR5 standard); each REF blocks a rank/bank for **tRFC** (~295-410 ns for 16-32 Gb). Overhead grows with density: several % of bandwidth and a big share of idle power.
- **Mitigations:** per-bank / same-bank refresh (DDR5 REFsb), refresh scheduling during idle periods, retention-aware refresh (RAIDR: most rows retain far longer than 64 ms), self-refresh in low-power states, temperature-compensated refresh.
- **Reliability link:** variable retention time (VRT) and RowHammer make "refresh less" risky — needs ECC/profiling.

**Follow-ups:** Draw the sense-amp waveform during ACT. How does refresh interfere with a PIM operation that occupies a bank for many cycles?','["DRAM","Refresh"]','["charge sharing","sense amplifier","restore","retention time","tREFI","tRFC","refresh overhead"]','Medium','["Micron","SK hynix","Samsung"]','both','vlsi','vlsi-v4','https://static.glassdoor.it/Interview/Micron-Technology-DRAM-Design-Engineer-Interview-Questions-EI_IE1648.0,17_KO18,38_IP2.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-mem-003','Memory systems & PIM/CIM','What is RowHammer, why is it getting worse, and what are the mitigations (TRR, PARA, RFM/PRAC, ECC)?','- **What:** repeatedly activating an **aggressor row** disturbs adjacent **victim rows** (wordline coupling, charge trapping/electron injection) and flips bits before the next refresh. **RowPress** = keeping a row open long has a similar effect.
- **Trend:** threshold (activations to first flip, HC_first) fell from ~139K (DDR3, 2014) to < 5-10K in recent DDR4/LPDDR4 because of smaller cells and tighter pitch.
- **Mitigations:**
  - **TRR** (in-DRAM target row refresh): track a few frequent aggressors; bypassed by many-sided patterns (TRRespass, Blacksmith).
  - **PARA:** on every ACT, refresh neighbors with small probability p — stateless, provable.
  - **Counter-based** (Graphene, Hydra) in the controller.
  - **DDR5 RFM** (refresh management) and **PRAC** (per-row activation counting, JEDEC 2024) with back-off/ALERT.
  - **ECC:** SECDED/Chipkill reduces but doesn''t eliminate exploitable flips (ECCploit); on-die ECC in DDR5 hides raw errors.
  - System: increased refresh rate, isolation (guard rows), memory-tagging.
- **Why it matters for PIM:** bulk in-DRAM ops (multi-row activation like Ambit/SIMDRAM) hammer rows by design → need activation-aware scheduling.

**Follow-ups:** Why is TRR insufficient? How would you size a counter table for a given threshold?','["RowHammer","DRAM reliability"]','["RowHammer","aggressor row","victim row","TRR","PARA","RFM","PRAC","ECC"]','Medium','["Micron","SK hynix","Samsung","Google","Meta"]','both','arch','arch-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-mem-004','Memory systems & PIM/CIM','How do bank-level parallelism and channel/rank/bank interleaving affect memory throughput? Estimate peak bandwidth of a DDR5-6400 channel.','- **Peak BW:** DDR5-6400 = 6400 MT/s × 64 bits (two 32-bit subchannels) / 8 = **51.2 GB/s per DIMM channel**. Sustained ~70-85% due to refresh, turnarounds, conflicts.
- **Bank-level parallelism:** while one bank waits tRCD/tRP, others can transfer. DDR5 has 32 banks (8 bank groups × 4) per die. Back-to-back reads to different bank groups use the shorter tCCD_S.
- **Constraints:** tRRD (ACT-to-ACT), **tFAW** (max 4 ACTs in a window — power delivery), bus turnaround.
- **Interleaving:** spread consecutive cache lines across channels → banks → ranks to exploit parallelism; tradeoff with row-buffer locality.
- **For PIM/near-bank:** the internal bandwidth of all banks activated in parallel is ~10-30x the external pin bandwidth — this "hidden bandwidth" is the core motivation (UPMEM, Samsung HBM-PIM, SK hynix AiM).

**Follow-ups:** How many banks must be active to sustain peak BW given tRC? What limits exploiting all internal bandwidth (power, tFAW)?','["DRAM","Memory parallelism"]','["bank-level parallelism","interleaving","tFAW","tRRD","peak bandwidth"]','Medium','["Micron","AMD","Intel","NVIDIA"]','both','arch','arch-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-mem-005','Memory systems & PIM/CIM','What is processing-in-memory (PIM)? Compare processing-near-memory (UPMEM, HBM-PIM, AiM) with processing-using-memory (Ambit, SIMDRAM). When does PIM win and what are its main problems?','**Motivation:** data movement dominates energy/time for memory-bound kernels (DRAM access ~100x energy of an arithmetic op); internal DRAM bandwidth is far higher than pin bandwidth.

**Flavors**
- **PnM (near-bank logic):** small cores/ALUs next to banks — UPMEM DPUs (DRAM-process RISC cores), Samsung HBM-PIM / Aquabolt-XL (FP16 SIMD per bank pair), SK hynix AiM (GEMV per bank, GDDR6). Good for GEMV, embeddings, reductions.
- **PuM (using the array itself):** Ambit/SIMDRAM triple-row activation computes MAJ → AND/OR; ComputeDRAM; RowClone for in-DRAM copy. Massive bit-parallelism (row-wide), only bulk bitwise / bit-serial arithmetic; needs vertical data layout.
- **In SRAM/NVM (CIM):** analog MACs in crossbars (ReRAM/PCM) or digital SRAM-CIM.

**Wins:** low arithmetic intensity, large data (LLM decode GEMV, recommendation embeddings, databases, graph analytics, genome).

**Problems:** DRAM process logic is slow/costly; thermal/power limits; data layout and placement (operands must share bank/subarray); host coherence & virtual memory; reliability (multi-row activation margins, RowHammer, ECC must work on transformed data); limited op set.


**Follow-ups:** For LLM decode, quantify why GEMV is a good PIM target (arithmetic intensity ≈ 1-2 FLOP/B). How would you keep host caches coherent with PIM updates?','["PIM"]','["near-memory processing","processing using memory","bulk bitwise","memory wall","data placement","programmability"]','Medium','["Samsung","SK hynix","Micron","AMD","Meta"]','both','arch','arch-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-mem-006','Memory systems & PIM/CIM','In analog compute-in-memory (ReRAM/PCM/SRAM crossbars), what non-idealities affect accuracy, and how are they mitigated?','**Crossbar MVM:** weights as conductances G, inputs as voltages V; column current I = Σ G·V (Ohm + Kirchhoff) → one-step MVM.

**Non-idealities**
- **Device-to-device / cycle-to-cycle variation** in programmed conductance; limited levels (2-4 bits/cell).
- **Drift** (PCM conductance decays ~ t^-ν), retention, read noise, stuck-at faults (yield).
- **IR drop / wire resistance** — larger arrays see lower effective voltages at far cells.
- **Sneak paths** in selector-less arrays (1T1R / 1S1R fixes).
- **ADC/DAC cost:** ADCs dominate energy/area; limited ADC precision truncates partial sums.
- **Nonlinear I-V**, temperature dependence.


**Follow-ups:** How do you choose ADC bits given array rows and cell bits? Analog vs digital SRAM-CIM — which would you pick for an edge NPU and why?','["CIM"]','["IR drop","device variation","conductance drift","ADC precision","sneak paths","noise-aware training","bit slicing"]','Hard','["Samsung","SK hynix","Micron","Intel","Apple"]','both','vlsi','vlsi-v4','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-mem-007','Memory systems & PIM/CIM','Explain Hamming SECDED ECC. How many check bits are needed for 64 data bits, and how are single errors corrected and double errors detected?','- **Hamming bound for SEC:** need r with 2^r ≥ k + r + 1. For k = 64: r = 7 (128 ≥ 72). **SECDED** adds one overall parity bit → **8 check bits → (72,64)**, 12.5% overhead (why ECC DIMMs are 72 bits wide).
- **Encode:** each check bit = XOR of a subset of data bits (columns of the H matrix are distinct, non-zero; Hsiao codes use odd-weight columns for balanced XOR trees and faster DED).
- **Decode:** syndrome s = H·r^T.
  - s = 0 → no error.
  - s matches a column of H (odd weight in Hsiao) → single error at that position → flip it.
  - s non-zero but not a column (even weight) → **double error detected**, uncorrectable → machine check.
- **Hardware:** XOR trees (log depth) + syndrome decoder; adds ~1 cycle latency; partial writes need read-modify-write.
- **Beyond SECDED:** Chipkill / SSC (symbol-based Reed-Solomon, survives a whole x4 chip failure), DDR5 on-die ECC (128+8 internal SEC) + system ECC, HBM ECC, BCH/LDPC in NAND.
Be ready to compare its overhead against (72,64).

**Follow-ups:** Write the XOR equations for a (7,4) Hamming code. Why might SECDED miscorrect a triple error?','["ECC"]','["Hamming code","SECDED","syndrome","parity","(72,64) code","Chipkill"]','Medium','["Micron","Samsung","SK hynix","Intel","AMD","NVIDIA"]','both','arch','arch-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-mem-008','Memory systems & PIM/CIM','How resilient are neural networks to bit errors in weights and memory? Which bits matter most, and how would you protect a DNN accelerator''s memory cheaply?','- **Observations:** DNNs tolerate many random low-order bit errors, but a single flip in a **high-order exponent bit** of an FP32/BF16 weight (or MSB of an INT8 weight) can turn a weight into ~1e38 and collapse accuracy (silent data corruption). Sensitivity varies by layer (first/last layers, depthwise conv, attention projections).
- **Evaluation:** fault-injection campaigns (PyTorchFI-style) at a given BER; metrics: accuracy drop, SDC rate, critical-bit maps.
- **Cheap protection options:**
  - Range clipping / activation bounding (Ranger), weight bounds checks.
  - Quantization to INT8 reduces sensitivity of extreme values.
  - Algorithm-based fault tolerance (ABFT) checksums for GEMM.
  - Standard SECDED on SRAM buffers, Chipkill on DRAM.
- **Production context:** Meta and Google have reported silent data corruption from defective CPUs at fleet scale → detection at the application level matters.

**Pitfalls:** claiming "NNs are robust so no ECC needed" — the exponent-bit case kills that.

**Follow-ups:** How would you compute the overhead of selective ECC vs full SECDED on a 7B-parameter model? How does ABFT for GEMM work?','["ECC","DNN reliability"]','["bit-flip sensitivity","exponent bits","selective protection","approximate ECC","fault injection","SDC"]','Hard','["Meta","Google","NVIDIA","Micron"]','both','accel','accel-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-mem-009','Memory systems & PIM/CIM','Compare memory technologies for AI systems: SRAM, HBM, LPDDR, GDDR, CXL-attached memory, and NAND/SSD. Where does each fit?','| Tech | Bandwidth | Capacity | Notes |
|---|---|---|---|
| On-chip SRAM | 10s-100s TB/s | 10s-100s MB (Cerebras WSE: ~44 GB on wafer) | lowest energy, expensive area |
| HBM3E | ~1.2 TB/s/stack | 24-36 GB/stack | training/inference GPUs, interposer cost |
| GDDR7 | ~1.5 TB/s on a 384-bit bus | ~24-32 GB | graphics, cheaper inference cards |
| LPDDR5X | ~0.5 TB/s with wide buses | 100s GB | power-efficient, used in Grace, Apple M-series, some inference ASICs |
| DDR5 + CXL | 50-64 GB/s per channel / x8-x16 link | TBs | capacity expansion, memory pooling, extra ~100-200 ns latency |
| NAND SSD | GB/s | TBs | KV-cache/weight offload, checkpoints |

**Story:** LLM inference capacity (weights + KV cache) vs bandwidth (decode) trade-off drives tiering: hot weights in HBM, KV cache spilled to CPU memory/CXL/SSD, and SRAM-heavy designs (Groq, Cerebras) trade capacity for bandwidth.

**Follow-ups:** How does CXL.mem keep coherence? Why would an inference startup choose LPDDR over HBM?','["Memory hierarchy"]','["HBM","LPDDR5X","GDDR7","CXL","capacity vs bandwidth","cost per GB"]','Medium','["Micron","SK hynix","Samsung","Meta","Google","Etched","Cerebras"]','both','arch','arch-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-mem-010','Memory systems & PIM/CIM','Design a near-memory accelerator for LLM decode (GEMV over weights stored in DRAM). What goes in the logic, how is data laid out, and what is the expected speedup over a GPU?','**Framing:** decode with batch 1 is GEMV: each weight byte is used once per token → intensity ≈ 2 FLOP per weight → completely bandwidth bound on GPUs (~3 TB/s HBM gives ~1.5 TFLOP/s effective of > 900 TFLOP/s peak).

**Design sketch**
- Per-bank (or per bank-pair) MAC units: e.g., 16 BF16/INT8 MACs + small accumulator buffer + input-vector broadcast register, at DRAM-process clock (~250-500 MHz).
- Command: host broadcasts the input vector, issues "all-bank MAC" commands; each bank streams its row segment through the MACs (internal BW = banks × columns/cycle).
- **Layout:** partition weight matrix rows across banks/channels so each bank owns full output rows (no cross-bank reduction) or columns with a final reduction in the buffer die; align tiles to DRAM rows to maximize row hits.
- Non-linear ops (softmax, layernorm) and attention over the KV cache stay on host or a logic die.
- **Speedup estimate:** internal bandwidth / external bandwidth ≈ 4-16x for the GEMV part (AiM and HBM-PIM report ~2-10x on end-to-end GEMV-heavy workloads), discounted by Amdahl (other ops) and batching (larger batches raise intensity → GPU catches up).
- **Constraints:** power (tFAW-like activation limits), DRAM-process logic area (~10-25% of die), thermal, programmability, ECC on PIM paths, host virtual memory/coherence.

**Follow-ups:** At what batch size does the GPU win again?','["PIM","LLM inference"]','["GEMV","arithmetic intensity","bank-level PIM","data layout","KV cache","host interface"]','Hard','["SK hynix","Samsung","Micron","NVIDIA","Meta"]','fulltime','arch','arch-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-001','ML accelerators & ML systems','How does a systolic array compute a matrix multiply? Compare weight-stationary, output-stationary and input-stationary dataflows.','**Systolic array:** an N×N grid of MAC PEs; data moves only between neighbors each cycle (short wires, high reuse, no global buses). TPUv1: 256×256 INT8 MACs, weight-stationary.

**Weight-stationary (TPU):** preload a weight tile into PEs; activations flow left→right, partial sums flow top→bottom and exit at the bottom. Max weight reuse; good when weights are reused across many inputs (large batch / conv). Fill + drain ≈ 2N cycles overhead per tile.

**Output-stationary (ShiDianNao, many NPUs):** each PE accumulates one output; inputs and weights stream past. Partial sums never move → saves accumulator traffic; good for large K.

**Input-stationary:** keep activations, stream weights; useful when activations are reused more.

**Row-stationary (Eyeriss):** maps 1D conv rows to PEs to maximize reuse of all three in the RF.

**Utilization pitfalls:** small/odd matrix shapes (e.g., batch-1 GEMV in LLM decode) leave most of the array idle → that''s why decode is memory-bound on TPUs too; depthwise conv maps poorly.

**Equation:** cycles for M×K × K×N on an S×S WS array ≈ ceil(K/S)·ceil(N/S)·(M + 2S) (stream M rows per weight tile, plus fill/drain).

**Follow-ups:** Write RTL for one PE. How do you handle a matrix smaller than the array? Why do newer designs use several smaller arrays (e.g., 128×128 × 4) instead of one huge one?','["Systolic arrays","Dataflow"]','["systolic array","weight stationary","output stationary","row stationary","PE utilization","fill/drain"]','Medium','["Google","Meta","Tenstorrent","Etched","Qualcomm"]','both','accel','accel-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-002','ML accelerators & ML systems','How would you analyze the performance of a deep-learning primitive? Use the roofline model: an accelerator has 400 TFLOP/s and 2 TB/s. Is a 4096×4096 FP16 GEMV compute- or memory-bound? What about a 4096×4096×4096 GEMM?','**Roofline:** attainable FLOP/s = min(peak FLOP/s, BW × arithmetic intensity I), I = FLOPs / bytes moved from the memory level considered.

**Ridge point** = 400e12 / 2e12 = **200 FLOP/B**.

**GEMV 4096×4096 FP16:** FLOPs = 2·4096² ≈ 33.6 M; bytes ≈ weights 2·4096² ≈ 33.6 MB (vectors negligible) → I ≈ **1 FLOP/B** → memory-bound; attainable ≈ 2 TFLOP/s (0.5% of peak). Time ≈ 33.6 MB / 2 TB/s ≈ 17 µs.

**GEMM 4096³ FP16:** FLOPs = 2·4096³ ≈ 137 G; bytes (ideal, each matrix once) = 3·2·4096² ≈ 100 MB → I ≈ **1365 FLOP/B** → compute-bound; time ≈ 137e9/400e12 ≈ 0.34 ms.

**Use in interviews ("how do you analyze a DL primitive?"):** compute FLOPs and bytes per level (DRAM, L2, SMEM), place on roofline, compare with measured (Nsight Compute), identify the gap (occupancy, bank conflicts, tail effects, launch overhead).

**Pitfalls:** forgetting realistic tiling reloads; using peak instead of achievable bandwidth (~80-90%).

**Follow-ups:** How does batching change the GEMV point? Add an L2/SRAM roofline (hierarchical roofline).','["Roofline","Performance modeling"]','["arithmetic intensity","ridge point","memory-bound","compute-bound"]','Medium','["NVIDIA","Google","Meta","AMD","Cerebras"]','both','accel','accel-x1','https://www.glassdoor.com/Interview/NVIDIA-Interview-E7633-RVW92233340.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-003','ML accelerators & ML systems','What is quantization? Compare INT8, FP8 (E4M3/E5M2), and 4-bit weight-only quantization. What is the difference between PTQ and QAT, and per-tensor vs per-channel scales?','- **Affine quantization:** q = round(x/s) + z; dequant x ≈ s(q − z). Symmetric (z = 0) common for weights.
- **Granularity:** per-tensor (one scale) < per-channel (per output channel; standard for weights) < per-group (e.g., 128 elements, used in 4-bit LLM weight quant).
- **INT8:** 4x smaller than FP32, integer MACs much cheaper (area/energy); standard for CNN inference (Qualcomm Hexagon, TPUv1).
- **FP8:** E4M3 (more precision, used for forward) and E5M2 (more range, gradients); Hopper/Blackwell tensor cores; good for training with per-tensor scaling (delayed scaling, MX block scaling with shared exponents, FP4/MXFP4 on Blackwell).
- **Weight-only INT4 (GPTQ, AWQ):** shrinks weights 4x → decode is bandwidth bound, so ~2-3.5x faster; activations stay FP16; dequant in the kernel.
- **LLM issue: activation outliers** → SmoothQuant moves scale from activations to weights; LLM.int8 keeps outlier channels in FP16.
- **PTQ** (calibrate on sample data, no training) vs **QAT** (fake-quant in training with straight-through estimator) — QAT recovers accuracy at low bits.
- **HW view:** accumulators wider (INT32 for INT8 MACs), requant (scale + shift) after each layer; mixed precision needs flexible datapaths.

**Follow-ups:** Why does FP8 need scaling factors? Design the datapath for an INT8 MAC with requantization.','["Quantization"]','["INT8","FP8","INT4","scale/zero-point","per-channel","PTQ","QAT","outliers","GPTQ","AWQ"]','Medium','["NVIDIA","Qualcomm","Meta","Google","Apple"]','both','mlsys','mlsys-l2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-004','ML accelerators & ML systems','Explain the KV cache in transformer inference. How big is it for a 70B-class model and why is decode memory-bandwidth bound? How do MQA/GQA and PagedAttention help?','- **What:** during autoregressive generation, each new token attends to all previous tokens'' K and V. Caching them avoids recomputing them → per step cost O(n) instead of O(n²).
- **Size:** 2 (K,V) × layers × kv_heads × head_dim × seq_len × batch × bytes.
  Llama-2-70B-like (80 layers, 8 KV heads with GQA, head_dim 128, FP16): 2·80·8·128·2 B = **320 KB per token** → 4K context × batch 32 ≈ **42 GB**. Without GQA (64 heads) it would be 8x larger.
- **Prefill vs decode:** prefill processes the prompt in parallel (GEMMs, compute-bound). Decode generates one token per sequence per step: weights and the whole KV cache are read for very few FLOPs → I ≈ batch size FLOP/B for weights and ~1 for attention → memory-bound.
- **MQA/GQA:** share K/V across query heads → shrinks the cache and bandwidth (small quality cost for MQA; GQA close to MHA).
- **PagedAttention (vLLM):** store the cache in fixed-size blocks with a block table (like OS paging) → no fragmentation, higher batch, prefix sharing.
- **Other:** KV quantization (FP8/INT4), sliding window, offload to CPU/CXL, MLA (DeepSeek) latent compression, speculative decoding (amortize weight reads over several tokens).

**Follow-ups:** If the KV cache doesn''t fit, what are your options? How would a PIM device accelerate attention over the KV cache?','["LLM inference","KV cache"]','["KV cache","prefill vs decode","MQA","GQA","PagedAttention","memory bandwidth"]','Medium','["NVIDIA","Meta","Google","Etched","Cerebras","AMD"]','both','mlsys','mlsys-l2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-005','ML accelerators & ML systems','How does FlashAttention work and why is it faster than standard attention even though it does the same (or more) FLOPs?','- **Standard attention:** S = QKᵀ (N×N) written to HBM, softmax reads/writes it, then P·V → O(N²) HBM traffic; memory-bound for long sequences.
- **FlashAttention:** tile Q, K, V into blocks that fit in SRAM (shared memory/registers). For each Q block, loop over K/V blocks, compute the block of scores, and use **online softmax**: keep running max m and sum l per row; when a new block arrives, rescale: m'' = max(m, m_blk), l'' = e^{m−m''}·l + Σ e^{s−m''}, O'' = e^{m−m''}·O + e^{s−m''}·V_blk. Normalize at the end.
- **Result:** the N×N matrix never touches HBM → HBM traffic O(N²·d²/M) instead of O(N²) (M = SRAM size); fused kernel, exact (not approximate).
- **Backward:** recompute S/P from Q,K blocks instead of storing them (save memory; recompute FLOPs are cheap vs IO).
- **v2:** better work partitioning (parallelize over sequence, fewer non-matmul FLOPs). **v3 (Hopper):** warp specialization, async TMA, wgmma, FP8.
- **Decode variant:** Flash-Decoding splits the KV sequence across thread blocks (split-K) since batch×heads is too small to fill the GPU.

**Follow-ups:** Derive the online softmax update. Why is it hard to apply FlashAttention as-is to decode?','["Attention","Kernel optimization"]','["FlashAttention","tiling","online softmax","IO-awareness","SRAM","recomputation"]','Hard','["NVIDIA","Meta","Google","AMD","Etched"]','both','mlsys','mlsys-l2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-006','ML accelerators & ML systems','Compare data parallelism, tensor (model) parallelism, pipeline parallelism, and ZeRO/FSDP for training large models. What communication does each need?','- **Data parallel (DP):** replicate the model, split the batch; **all-reduce gradients** each step (ring all-reduce moves ~2× model size per GPU). Simple; memory limited by full replica.
- **ZeRO / FSDP:** shard optimizer state (ZeRO-1), gradients (2), parameters (3); all-gather params before each layer, reduce-scatter gradients → same volume as DP ×1.5 but memory per GPU ÷ N.
- **Tensor parallel (Megatron):** split each GEMM''s weights across GPUs (column then row parallel in MLP); **all-reduce activations twice per layer** in forward → needs NVLink-class bandwidth, kept within a node.
- **Pipeline parallel:** split layers into stages; micro-batches flow through; **bubble** fraction ≈ (p − 1)/(m + p − 1) for p stages, m micro-batches; 1F1B / interleaved schedules reduce memory/bubble; point-to-point activation sends.
- **Sequence/context parallel**, **expert parallel** (MoE all-to-all).
- **3D parallelism:** TP within node, PP across nodes, DP/FSDP across replicas.
- **Hardware implications:** scale-up interconnect (NVLink/NVSwitch, TPU ICI torus), in-network reduction (SHARP), overlapping comm with compute.

**Follow-ups:** Compute all-reduce time for a 7B model in BF16 over 8 GPUs at 400 GB/s. Why does TP not scale across nodes?','["Distributed training"]','["data parallel","tensor parallel","pipeline parallel","ZeRO","FSDP","all-reduce","bubble"]','Medium','["Meta","Google","NVIDIA","Cerebras","AMD"]','both','mlsys','mlsys-l2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-007','ML accelerators & ML systems','How do batching strategies affect inference throughput and latency? Explain static, dynamic and continuous (in-flight) batching for LLM serving.','- **Why batch:** decode is bandwidth bound; reading the weights once for B sequences multiplies useful FLOPs by B with nearly the same time until compute-bound (ridge ~ hundreds of tokens on modern GPUs).
- **Static batching:** wait for a batch, run until the longest sequence finishes → idle slots and padding.
- **Dynamic batching:** gather requests within a time window (Triton) — fine for fixed-size models (CNNs).
- **Continuous batching (Orca, vLLM, TensorRT-LLM in-flight batching):** schedule at the **iteration** level: finished sequences leave and new ones join each step → high utilization; requires paged KV memory.
- **Metrics:** TTFT (time to first token, dominated by prefill), TPOT/ITL (time per output token, decode), throughput (tokens/s), goodput under SLO.
- **Prefill/decode interference:** a long prefill stalls decodes → chunked prefill, or **disaggregated serving** (separate prefill and decode pools, transfer KV cache — DistServe, Splitwise).
- **Hardware angle:** Etched/Groq-like ASICs exploit very large batches or deterministic pipelines; memory capacity for KV cache limits batch.

**Follow-ups:** Given an SLO of 50 ms TPOT, how do you choose max batch? How does speculative decoding interact with batching?','["LLM serving"]','["continuous batching","throughput vs latency","TTFT","TPOT","prefill/decode disaggregation"]','Medium','["NVIDIA","Meta","Google","Etched","Cerebras"]','both','mlsys','mlsys-l2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-008','ML accelerators & ML systems','How would you map a convolution onto a matrix-multiply engine? What is im2col and what are its costs? What about depthwise convolution?','- **im2col:** unfold each K×K×C receptive field into a column → input matrix (C·K·K) × (H_out·W_out); weights as (F) × (C·K·K); conv = GEMM. Cost: input data duplicated up to K² times in memory → bandwidth/memory blowup.
- **Implicit GEMM** (cuDNN/CUTLASS): compute im2col addresses on the fly while loading tiles into shared memory → GEMM efficiency without materializing.
- **Winograd F(2×2,3×3):** reduce multiplies 2.25x at the cost of transforms and numerical error (bad for low precision).
- **FFT** for large kernels.
- **Depthwise conv:** each channel has its own K×K filter → no reduction over C → GEMM has tiny K dimension, low arithmetic intensity, poor systolic utilization. Map on vector units, fuse with the following pointwise (1×1) conv, or use specialized dataflows.
- **1×1 conv** is already a GEMM.

**Follow-ups:** Compute arithmetic intensity of a 3×3 depthwise conv vs a 1×1 conv. How does an NPU handle stride and padding without im2col?','["Convolution mapping"]','["im2col","implicit GEMM","Winograd","depthwise conv","data reuse"]','Medium','["Qualcomm","Apple","Google","NVIDIA"]','both','accel','accel-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-009','ML accelerators & ML systems','How would you optimize matrix multiplication on a CPU and on a GPU? Walk through the levels of tiling.','**CPU (BLIS/GotoBLAS structure)**
1. Loop order: avoid the naive i-j-k with strided B accesses; use i-k-j or pack B.
2. Cache blocking: tile so a block of B fits L2/L3 and a panel of A fits L1 (kc, mc, nc parameters).
3. **Packing** tiles into contiguous buffers (no TLB/conflict misses).
4. Register-blocked **micro-kernel** (e.g., 6×16 outer product with AVX-512 FMA) — keeps C accumulators in registers.
5. Multithreading over outer loops; NUMA-aware.

**GPU (CUTLASS-style)**
1. Thread-block tile (e.g., 128×128×32) of C per CTA.
2. Load A/B tiles global → shared memory (coalesced, `cp.async`/TMA), **double/multi-buffer** to overlap loads with math.
3. Warp tile → tensor-core MMA fragments in registers; avoid bank conflicts with swizzled layouts.
4. Epilogue fusion (bias, activation, quantize).
5. Split-K or stream-K for skinny shapes; tune tile sizes for occupancy and wave quantization.

**Check with roofline:** big GEMM should hit 70-90% of tensor-core peak.

**Follow-ups:** How do you pick tile sizes (registers, shared memory, occupancy)? What changes for a tall-skinny (M=1) GEMM?','["GEMM optimization"]','["tiling","blocking","register blocking","shared memory","tensor cores","double buffering","vectorization"]','Medium','["AMD","NVIDIA","Intel","Meta"]','both','accel','accel-x1','https://www.glassdoor.com/Interview/AMD-Interview-E15-RVW95775272.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-010','ML accelerators & ML systems','Design an accelerator for transformer inference. What are the main blocks, how do you size compute vs memory, and what are the bottlenecks?','**Clarify:** prefill vs decode, model size, batch, latency SLO, precision, power/area budget.

**Blocks**
- Matrix engine(s): systolic arrays or tensor-core-like MMA tiles (FP8/INT8, BF16 accumulate FP32).
- Vector/SFU unit: softmax (exp, max, sum), layernorm/RMSnorm, GELU/SiLU, rotary embeddings, dequant.
- On-chip SRAM: weights/activation buffers, KV cache tiles; double-buffered via DMA.
- Memory: HBM (bandwidth) or LPDDR (capacity/cost); scale-out links for TP/PP.
- Control: VLIW/command processor + compiler-driven static schedule.

**Sizing:** decode needs bytes ≈ model size (+ KV) per step / batch. E.g., 70B INT8 = 70 GB per step; at 4 TB/s → 17.5 ms/step → ~57 steps/s per sequence; throughput scales with batch until compute-bound (ridge = FLOPS/BW). Choose compute so that at target batch you''re near the ridge.

**Bottlenecks:** bandwidth for decode, KV-cache capacity (limits batch), softmax/nonlinear throughput (often underprovisioned), interconnect for multi-chip, utilization on small shapes, flexibility vs specialization (Etched''s transformer-only bet).

**Reliability:** ECC on SRAM/HBM, selective protection of sensitive weights.

**Follow-ups:** How do you keep the vector unit from becoming the bottleneck in attention? What would you change for a MoE model?','["Accelerator design"]','["GEMM engine","vector unit","softmax","SRAM buffers","HBM","dataflow","utilization"]','Hard','["Etched","Tenstorrent","Cerebras","Google","Meta"]','fulltime','accel','accel-x2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-011','ML accelerators & ML systems','Why are number formats like BF16 and FP16 different, and what precision do accumulators need? How do you design a MAC unit for mixed precision?','- **FP32:** 1-8-23. **FP16:** 1-5-10 → range ~6e-5 to 65504, overflow/underflow risk in training (needs loss scaling). **BF16:** 1-8-7 → FP32''s range, less precision; no loss scaling needed, easy conversion (truncate FP32).
- **TF32** (1-8-10) used in Ampere tensor cores for FP32 inputs.
- **Accumulation:** sums of thousands of products lose low bits in narrow formats → accumulate in FP32 (or INT32 for INT8). FP8 GEMMs on Hopper accumulate in a reduced-precision path, so libraries periodically promote to FP32.
- **MAC design:** multiplier for mantissas (8×8 for BF16 is tiny), exponent add, alignment shifter, adder with wide accumulator, normalization; fused dot-product units (multi-term adders) share alignment/normalize across several products to save area.
- **Area scaling:** multiplier area ~ mantissa² → BF16 multiplier ~ 1/9th of FP32''s.
- **Training tricks:** stochastic rounding for low-precision updates, master weights in FP32.

**Follow-ups:** Why does block floating point (MX formats) reduce cost? Sketch a pipelined FP adder.','["Number formats","MAC design"]','["BF16","FP16","FP32 accumulate","dynamic range","mantissa","Kahan","stochastic rounding"]','Medium','["NVIDIA","Google","Tenstorrent","AMD","Intel"]','both','accel','accel-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-012','ML accelerators & ML systems','Your model''s training step on a GPU is slower than expected. How would you profile and find the bottleneck?','1. **Timeline first (Nsight Systems / PyTorch profiler):** GPU utilization gaps → CPU-bound (data loader, Python overhead, synchronizations like `.item()`), small kernels (launch overhead — use CUDA graphs, fusion/torch.compile), communication not overlapped.
2. **Top kernels by time:** for each, compute achieved FLOP/s and bandwidth vs roofline (Nsight Compute): memory-bound kernels (elementwise, norm, softmax) → fuse; compute-bound GEMMs below peak → check shapes (multiples of 8/16 for tensor cores), precision (TF32/BF16 enabled?), tiling, occupancy.
3. **Memory:** activation checkpointing, fragmentation, host-device copies (pinned memory, async).
4. **Multi-GPU:** NCCL time, overlap all-reduce with backward (bucketing), stragglers, topology.
5. **Validate:** change one thing, re-measure, compare to an analytical model.

**Pitfalls:** optimizing a kernel that''s 2% of time; measuring with asynchronous CUDA without synchronizing.

**Follow-ups:** What''s warp-stall analysis telling you if "long scoreboard" dominates? How do CUDA graphs reduce overhead?','["Performance analysis"]','["profiling","Nsight Systems","Nsight Compute","kernel launch overhead","data loading","roofline","overlap"]','Medium','["NVIDIA","Meta","Google","AMD"]','both','mlsys','mlsys-l2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-013','ML accelerators & ML systems','What is sparsity in DNN accelerators? Compare unstructured, structured, and 2:4 sparsity, and what hardware needs to support them.','- **Unstructured** (any weight can be zero): high compression at given accuracy, but irregular → indexing overhead (CSR/bitmaps), load imbalance; pays off only at very high sparsity (> 80-90%) on general hardware. Cerebras exploits unstructured sparsity through dataflow (only non-zeros trigger work).
- **Structured** (channels, blocks, heads): dense compute on smaller tensors; easy speedup, more accuracy loss.
- **2:4 (NVIDIA Ampere+):** 2 non-zeros per 4 → 2-bit metadata per value; sparse tensor core selects matching activations via muxes → up to 2x math throughput, ~50% weight memory; fine-tune to recover accuracy.
- **Activation sparsity** (ReLU zeros): zero-gating saves energy (Eyeriss), skipping requires compaction.
- **HW costs:** metadata storage and decoding, crossbars/muxes, irregular memory access, balancing across PEs.

**Follow-ups:** Design the operand-select logic for 2:4 sparsity. Why is LLM weight sparsity harder than CNN sparsity?','["Sparsity"]','["2:4 structured sparsity","unstructured","compressed formats","zero skipping","load imbalance"]','Medium','["NVIDIA","Cerebras","Meta","Qualcomm"]','both','accel','accel-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-014','ML accelerators & ML systems','What is operator fusion and why does it matter so much for performance on GPUs and accelerators?','- **Problem:** each unfused op reads inputs from HBM and writes outputs back. Elementwise ops (bias, GELU, dropout, residual add, layernorm) have intensity < 1 FLOP/B → pure bandwidth. A chain of 5 such ops = 5 round trips.
- **Fusion:** combine into one kernel so intermediates stay in registers/SRAM → traffic = 1 read + 1 write. Examples: GEMM epilogue fusion (bias+activation+quant), fused layernorm, FlashAttention (GEMM-softmax-GEMM).
- **Who does it:** XLA (TPU), TorchInductor (Triton codegen), TensorRT, TVM, MLIR linalg fusion; hand-written CUTLASS epilogues.
- **Limits:** fusion across reductions/broadcasts complicates tiling; register pressure; recomputation trade-offs; dynamic shapes.
- **Accelerators:** dataflow architectures (Tenstorrent, Cerebras, Etched) treat fusion as the default — data streams core-to-core without hitting DRAM.

**Follow-ups:** When is fusion harmful? How would an MLIR pass decide what to fuse?','["Kernel fusion","Graph compilers"]','["operator fusion","memory traffic","elementwise ops","epilogue fusion","torch.compile","XLA"]','Medium','["Google","Meta","NVIDIA","Tenstorrent"]','both','mlsys','mlsys-l3','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-ml-015','ML accelerators & ML systems','Estimate: how much on-chip SRAM would you need to hold a 3×3 conv layer''s working set for a 64×64×256 input and 256 output channels, and what''s the minimum DRAM traffic?','- **Weights:** 3·3·256·256 = 589,824 values → **576 KB** at INT8.
- **Input:** 64·64·256 = 1 M values → **1 MB**; **output:** same → 1 MB.
- **Whole layer on chip:** ~2.6 MB → fits in many NPUs (minimum traffic = read input + weights once, write output once ≈ 2.6 MB).
- **If SRAM is, say, 512 KB:** tile spatially (rows with a 2-row halo for 3×3) and/or by output channels. E.g., keep a weight tile of 64 output channels (144 KB) resident and stream input row-bands (64 cols × 256 ch × (rows+2)): each input band is reread 256/64 = 4 times → input traffic 4 MB. Choose tiling to minimize total traffic = Σ (tensor size × refetch factor).
- **FLOPs:** 2·64·64·256·256·9 ≈ 4.8 GFLOP → intensity ≈ 4.8e9 / 2.6e6 ≈ 1800 FLOP/B ideally → compute-bound if tiled well.

**Follow-ups:** Which loop order minimizes refetch for this layer? How does Timeloop/Accelergy explore this mapping space?','["Data reuse","Buffer sizing"]','["working set","tiling","data reuse","DRAM traffic","buffer sizing"]','Medium','["Qualcomm","Apple","Google","Tenstorrent"]','both','accel','accel-x1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-001','RTL design','Write synthesizable Verilog for a synchronous FIFO (parameterized width and depth) with full and empty flags.','Use pointers one bit wider than the address: equal → empty; MSBs differ and the rest equal → full (works for power-of-2 depth). For a non-power-of-2 depth (e.g., 5), use a counter instead.

```verilog
module sync_fifo #(parameter W = 8, parameter DEPTH = 16, localparam AW = $clog2(DEPTH)) (
  input  logic         clk, rst_n,
  input  logic         wr_en, rd_en,
  input  logic [W-1:0] wdata,
  output logic [W-1:0] rdata,
  output logic         full, empty
);
  logic [W-1:0] mem [DEPTH];
  logic [AW:0]  count;
  logic [AW-1:0] wptr, rptr;
  wire do_wr = wr_en && !full;
  wire do_rd = rd_en && !empty;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      wptr <= ''0; rptr <= ''0; count <= ''0;
    end else begin
      if (do_wr) begin
        mem[wptr] <= wdata;
        wptr <= (wptr == DEPTH-1) ? ''0 : wptr + 1''b1;
      end
      if (do_rd) rptr <= (rptr == DEPTH-1) ? ''0 : rptr + 1''b1;
      count <= count + do_wr - do_rd;   // simultaneous rd+wr keeps count
    end
  end
  assign rdata = mem[rptr];             // first-word-fall-through style read
  assign full  = (count == DEPTH);
  assign empty = (count == 0);
endmodule
```

**Talking points:** simultaneous read and write when full/empty (define behavior), registered vs FWFT read data, almost-full thresholds for backpressure, memory inferred as SRAM macro (then read has 1-cycle latency — add a skid/prefetch register).

**Pitfalls:** writing when full; wrapping pointers for non-power-of-2 depth; using blocking assignments in sequential logic.

**Follow-ups:** Can a FIFO built on single-port SRAM support a read and a write in the same cycle? (No directly — use two banks ping-pong, double-width words, or a 2x clock.) Remove the counter and use the extra-bit pointer method.','["FIFO"]','["synchronous FIFO","read/write pointers","full/empty","extra pointer bit","count"]','Medium','["NVIDIA","Apple","AMD","Qualcomm"]','both','rtl','rtl-m2','https://clear.glassdoor.nl/Interview/NVIDIA-Interview-E7633-RVW101273283.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-002','RTL design','Design an asynchronous FIFO. Why are pointers Gray-coded, how are full and empty generated, and why is it safe?','**Structure:** dual-port RAM; write pointer in wclk domain, read pointer in rclk domain; each pointer (N+1 bits) converted to **Gray** and passed through a **2-flop synchronizer** into the other domain.

**Why Gray:** consecutive values differ in one bit, so if the sampling flop goes metastable, it resolves to either the old or the new value — both are valid. With binary, several bits change and you could capture a garbage value (e.g., 0111→1000 sampled as 1111).

**Empty (read domain):** `rgray_next == wgray_sync`.
**Full (write domain):** `wgray_next == {~rgray_sync[N:N-1], rgray_sync[N-2:0]}` (top two bits inverted for Gray).

```verilog
// binary/gray pointer update in write domain
always_ff @(posedge wclk or negedge wrst_n)
  if (!wrst_n) {wbin, wgray} <= ''0;
  else         {wbin, wgray} <= {wbin_next, wgray_next};
assign wbin_next  = wbin + (winc & ~wfull);
assign wgray_next = (wbin_next >> 1) ^ wbin_next;
// 2-flop sync of read pointer into write clock
always_ff @(posedge wclk or negedge wrst_n)
  if (!wrst_n) {rq2_wgray, rq1_wgray} <= ''0;
  else         {rq2_wgray, rq1_wgray} <= {rq1_wgray, rgray};
assign wfull_val = (wgray_next == {~rq2_wgray[AW:AW-1], rq2_wgray[AW-2:0]});
```

**Safety argument:** synchronized pointers are *stale*, so full/empty are **pessimistic** (assert early, deassert late) — never overflow/underflow; only throughput cost.

**Rules:** Gray pointers must come straight from flops (no combinational logic before the synchronizer); depth must be a power of 2 for simple Gray (or use special Gray sequences); reset each side in its own domain.

**Follow-ups:** How to avoid the extra cycle of latency from computing Gray (keep both binary and Gray registers). Minimum FIFO depth for a burst? Why can''t you synchronize a multi-bit binary counter?','["FIFO","CDC"]','["async FIFO","Gray code","two-flop synchronizer","pessimistic full/empty","pointer synchronization"]','Hard','["Apple","NVIDIA","AMD","Intel","Qualcomm"]','both','rtl','rtl-m3','https://www.1point3acres.com/interview/thread/1147926',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-003','RTL design','How do you size a FIFO between a fast writer and a slow reader? Example: writer 100 MHz writes a burst of 80 words in 100 cycles; reader 50 MHz reads one word per cycle.','**Method:** depth = words written during the burst − words read in the same time (worst case, burst back-to-back).

- Worst case: the 80 words come back-to-back in 80 writer cycles = 800 ns (window placement: two 80-word bursts can be adjacent across window boundaries → 160 words in 160 cycles; check the spec — "80 in 100" usually means worst-case 160 back-to-back).
- Single 80-word burst: reader at 50 MHz reads 800 ns / 20 ns = 40 words → **depth ≥ 80 − 40 = 40**.
- Back-to-back case (160 words in 1600 ns): reads = 80 → depth ≥ 80.
- Also check **average rate**: writer avg = 0.8 × 100 MHz = 80 M words/s > reader 50 M words/s → no finite FIFO works for continuous traffic unless the writer has long idle gaps. Always check average rate first.
- Add margin for synchronizer latency (async FIFO: ~2-4 cycles of pointer delay) and reader idle cycles.

**Pitfalls:** forgetting the back-to-back burst scenario; not checking long-term rates.

**Follow-ups:** Reader also idles 1 out of 4 cycles — new depth? How do almost-full thresholds and credit-based flow control remove the sizing guesswork?','["FIFO sizing"]','["burst","FIFO depth","idle cycles","throughput mismatch"]','Medium','["NVIDIA","Qualcomm","Intel"]','both','rtl','rtl-m2','https://www.glassdoor.sg/Interview/NVIDIA-Interview-E7633-RVW431251.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-004','RTL design','What is metastability? How does a two-flop synchronizer work, and how do you compute MTBF?','- **Metastability:** if data changes inside the flop''s setup/hold window, the internal latch can hang near the midpoint for an unbounded (exponentially distributed) time before resolving to 0 or 1.
- **2-flop synchronizer:** first flop may go metastable; it has a full destination clock period to resolve before the second flop samples it. Doesn''t guarantee the *value* (old or new), only that downstream sees a clean level.
- **MTBF = e^(t_r/τ) / (T_w · f_clk · f_data)**, t_r = available resolution time (≈ T_clk − t_setup − t_clk-q), τ = flop time constant (~10-20 ps), T_w = metastability window. Each extra stage multiplies MTBF by e^(T_clk/τ) → huge.
- **Rules:** use synchronizer cells (high gain, low τ) placed close together; no logic between the two flops; only single-bit, slowly-changing (relative to dest clock) signals; pulses must be stretched or converted to toggles.
- **Voltage/temperature:** lower voltage → larger τ → worse MTBF (relevant for DVFS designs).

**Follow-ups:** When do you need 3 flops? How do you synchronize a reset (async assert, sync deassert)?','["Metastability","CDC"]','["metastability","synchronizer","MTBF","resolution time","tau"]','Medium','["Apple","NVIDIA","Intel","Qualcomm","AMD"]','both','rtl','rtl-m3','https://www.glassdoor.fr/Entretien/Apple-Entretien-E1138-RVW40488303.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-005','RTL design','How do you safely transfer (a) a single-cycle pulse and (b) a multi-bit bus across clock domains?','**(a) Pulse (fast → slow):** a 1-cycle pulse may be missed entirely. **Toggle synchronizer:** source flips a toggle flop on each pulse; destination syncs it with 2 flops and XORs the last two samples → 1-cycle pulse in destination. Pulses must be spaced ≥ ~2-3 destination cycles apart (else use a handshake or FIFO).

```verilog
always_ff @(posedge clk_a) if (pulse_a) tog_a <= ~tog_a;
always_ff @(posedge clk_b) {s3, s2, s1} <= {s2, s1, tog_a};
assign pulse_b = s3 ^ s2;
```

**(b) Multi-bit bus:** synchronizing each bit independently → skew means bits may be captured from different cycles (**reconvergence** problem). Options:
- **Gray code** if the value changes by ±1 (counters, pointers).
- **Req/ack handshake** (4-phase or 2-phase): hold data stable, sync `req`, destination captures data then returns `ack` → low throughput, safe.
- **MUX recirculation / data-enable:** send a synchronized enable; data held stable while it''s sampled.
- **Async FIFO** for streaming data.

**Verification:** CDC tools (Spyglass CDC, Questa CDC, Conformal) check structures; simulation alone won''t catch metastability.

**Follow-ups:** What if the source clock is much slower? Why is a reset-domain crossing (RDC) a separate issue?','["CDC"]','["pulse synchronizer","toggle synchronizer","handshake","MUX recirculation","async FIFO","reconvergence"]','Medium','["Apple","NVIDIA","Qualcomm","Intel","AMD"]','both','rtl','rtl-m3','https://www.glassdoor.com.au/Interview/Apple-Interview-E1138-RVW11371098.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-006','RTL design','Define setup and hold time. Given a path, how do you check for violations and how do you fix each kind?','- **Setup:** data must be stable t_su before the capturing edge. Check: T_clk + t_skew ≥ t_cq + t_logic,max + t_su (skew = capture clock arrival − launch clock arrival). Slack = required − arrival.
- **Hold:** data must stay stable t_h after the edge (new data mustn''t race through): t_cq + t_logic,min ≥ t_h + t_skew.
- **Key point:** hold doesn''t depend on clock period → a hold violation can''t be fixed by slowing the clock; a setup violation can.
- **Fixing setup:** reduce logic depth (restructure, retime, pipeline), upsize/lower-Vt cells, better placement, useful skew (delay capture clock), reduce fan-out, lower frequency.
- **Fixing hold:** insert delay buffers on the short path, adjust skew, use higher-Vt/slower cells on that path.
- **Other STA concepts:** jitter/uncertainty, OCV derates, multicycle and false paths, recovery/removal for async resets, latch time borrowing.

**Worked example:** t_cq = 50 ps, logic max 700 ps, t_su = 40 ps, skew +30 ps → min period = 50 + 700 + 40 − 30 = 760 ps → f_max ≈ 1.32 GHz.

**Follow-ups:** Positive skew helps setup but hurts hold — show why. How does a latch-based design borrow time?','["Static timing analysis"]','["setup time","hold time","clock skew","slack","clock-to-q","useful skew"]','Easy','["Apple","NVIDIA","AMD","Qualcomm","Intel","Micron"]','both','rtl','rtl-m4','https://www.glassdoor.fr/Entretien/Apple-Entretien-E1138-RVW40488303.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-007','RTL design','Design an FSM that takes a serial bit stream (MSB first) and outputs 1 when the number seen so far is divisible by 3.','**Idea:** track remainder r of the number so far. Appending bit b: new value = 2·old + b → r'' = (2r + b) mod 3.

| r | b=0 | b=1 |
|---|---|---|
| 0 | 0 | 1 |
| 1 | 2 | 0 |
| 2 | 1 | 2 |

Output = (r == 0) (Moore).

```verilog
module div3 (input logic clk, rst_n, b, output logic div);
  logic [1:0] r;
  always_ff @(posedge clk or negedge rst_n)
    if (!rst_n) r <= 2''d0;
    else case (r)
      2''d0: r <= b ? 2''d1 : 2''d0;
      2''d1: r <= b ? 2''d0 : 2''d2;
      2''d2: r <= b ? 2''d2 : 2''d1;
      default: r <= 2''d0;
    endcase
  assign div = (r == 2''d0);
endmodule
```

**Generalize:** divisible by N → N states, r'' = (2r + b) mod N. LSB-first variant needs to track weight 2^k mod N (cycle 1,2,1,2 for N = 3), so state = (remainder, parity of position).

**Follow-ups:** Do it LSB-first. Divisible by 5? Mealy vs Moore output timing.','["FSM"]','["Moore FSM","remainder states","modulo arithmetic"]','Medium','["NVIDIA","Intel","AMD"]','both','rtl','rtl-m1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-008','RTL design','Design a sequence detector for 1011 (overlapping allowed). Moore or Mealy? Write the Verilog.','Mealy states = longest prefix matched: S0 (none), S1 ("1"), S2 ("10"), S3 ("101").

| State | in=0 | in=1 |
|---|---|---|
| S0 | S0 | S1 |
| S1 | S2 | S1 |
| S2 | S0 | S3 |
| S3 | S2 | S1 / **out=1** (overlap: "1011" ends in "1") |

```verilog
typedef enum logic [1:0] {S0, S1, S2, S3} st_t;
st_t st;
always_ff @(posedge clk or negedge rst_n)
  if (!rst_n) st <= S0;
  else unique case (st)
    S0: st <= in ? S1 : S0;
    S1: st <= in ? S1 : S2;
    S2: st <= in ? S3 : S0;
    S3: st <= in ? S1 : S2;
  endcase
assign det = (st == S3) && in;   // Mealy
```

- **Mealy:** fewer states, output same cycle, but combinational from input (glitches, timing). **Moore:** one extra state (S4 = "1011"), output registered/clean, one cycle later.
- Encoding: binary vs one-hot (faster, more flops; common in FPGAs) vs Gray.

**Follow-ups:** Non-overlapping version. Implement as a 4-bit shift register compare — when is that better?','["FSM"]','["sequence detector","overlapping","Mealy vs Moore","state encoding"]','Easy','["NVIDIA","Apple","Qualcomm","Intel","AMD"]','both','rtl','rtl-m1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-009','RTL design','Design a round-robin arbiter for N requesters. Write the Verilog and discuss fairness and timing.','**Approach (masked priority arbiter):** keep a mask of requesters with lower priority than the last grant. Grant = fixed-priority on (req & mask) if non-zero, else fixed-priority on req.

```verilog
module rr_arb #(parameter N = 4) (
  input  logic clk, rst_n,
  input  logic [N-1:0] req,
  output logic [N-1:0] gnt
);
  logic [N-1:0] mask, mreq, gnt_m, gnt_u;
  assign mreq  = req & mask;
  assign gnt_m = mreq & (~mreq + 1''b1);   // isolate lowest set bit
  assign gnt_u = req  & (~req  + 1''b1);
  assign gnt   = (|mreq) ? gnt_m : gnt_u;
  always_ff @(posedge clk or negedge rst_n)
    if (!rst_n) mask <= ''1;
    else if (|gnt) mask <= ~((gnt << 1) - 1''b1); // bits above the granted one
endmodule
```
(`(gnt<<1)-1` gives ones at and below the granted bit; invert → strictly higher positions get priority next.)

- **Fairness:** each active requester waits at most N−1 grants → no starvation.
- **Variants:** weighted RR, matrix arbiter (N² state, any LRU order), hold grant for multi-cycle packets (lock until `last`), separable allocators in NoC routers.
- **Timing:** the find-first-set is a carry chain → O(N) unless using parallel-prefix; for large N use tree arbiters.

**Follow-ups:** Add priority levels. How would you verify it (assertions: one-hot grant, grant ⊆ req, bounded wait)?','["Arbiters"]','["round-robin","priority arbiter","mask","fairness","starvation","one-hot grant"]','Medium','["NVIDIA","Apple","AMD","Tenstorrent"]','both','rtl','rtl-m2','https://www.glassdoor.ca/Interview/NVIDIA-Interview-E7633-RVW1794125.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-010','RTL design','How does clock gating work? Why must you use a latch-based integrated clock gate (ICG) rather than an AND gate?','- **Goal:** stop the clock to idle registers → saves dynamic power on the clock tree and flops (clock is often 30-40% of dynamic power).
- **AND gate alone:** if `en` changes while clk is high, the gated clock gets a truncated pulse/glitch → false clocking.
- **ICG:** a **latch transparent when clk is low** captures `en`; output `gclk = clk & en_latched`. `en` can only change the latch while clk is low, so during the high phase the AND input is stable → no glitches. (For negative-edge logic use an OR-based gate with a latch transparent when clk is high.)

```verilog
always_latch if (!clk) en_l = en | test_en;
assign gclk = clk & en_l;
```
- **Timing:** `en` must meet setup to the latch (half cycle less margin) — the clock-gating check in STA.
- **Synthesis:** tools infer ICGs from `if (en) q <= d;` across banks of flops (≥ 3-4 flops to be worth it). `test_en` for scan.
- **Hierarchy:** fine-grained (register level) vs coarse (block level), plus power gating for leakage.

**Follow-ups:** Design a glitch-free clock mux between two asynchronous clocks. What''s the downside of too many ICGs (clock tree skew, area)?','["Clock gating","Low power"]','["ICG","latch-based clock gate","glitch","enable timing","power"]','Medium','["Apple","Qualcomm","NVIDIA","Intel"]','both','rtl','rtl-m1','https://static-pc.glassdoor.de/Interview/Apple-Engineer-Interview-Questions-EI_IE1138.0,5_KO6,14_IP4.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-011','RTL design','Design a glitch-free clock switch (mux) between two clocks that may be asynchronous to each other.','**Problem:** switching `sel` on a plain mux can produce a runt pulse when one clock is high and the other low.

**Classic circuit:** each clock path has an enable flop chain clocked on the **falling edge** of its own clock. Enable for clk0 = `~sel & ~en1_sync`; for clk1 = `sel & ~en0_sync` (cross-coupled feedback). Output = `(clk0 & en0) | (clk1 & en1)`.

```verilog
// asynchronous clocks: 2-flop sync per side, final flop on negedge
always_ff @(posedge clk0 or negedge rst_n) if(!rst_n) s0a<=0; else s0a <= ~sel & ~en1;
always_ff @(negedge clk0 or negedge rst_n) if(!rst_n) en0<=0; else en0 <= s0a;
always_ff @(posedge clk1 or negedge rst_n) if(!rst_n) s1a<=0; else s1a <= sel & ~en0;
always_ff @(negedge clk1 or negedge rst_n) if(!rst_n) en1<=0; else en1 <= s1a;
assign clk_out = (clk0 & en0) | (clk1 & en1);
```

**Sequence:** sel changes → the current clock''s enable drops on its falling edge (output held low) → only then, after synchronizing, the other enable rises on its own falling edge → output resumes with full pulses. Never both enabled.

**Pitfalls:** if the currently selected clock is stopped, the switch hangs (needs a fallback/forced path); reset must put exactly one enable on.

**Follow-ups:** What happens if one clock is dead? How do standard-cell libraries provide this (clock mux cells, ICG-based)?','["Clocking"]','["glitch-free clock mux","negative-edge flops","synchronizer","clock switching"]','Hard','["NVIDIA","Apple","Qualcomm"]','both','rtl','rtl-m3','https://www.glassdoor.ie/Interview/NVIDIA-Interview-E7633-RVW2809795.htm',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-012','RTL design','Explain blocking vs non-blocking assignments in Verilog. What happens if you use blocking assignments in a sequential always block?','- **Non-blocking (`<=`):** RHS evaluated at the time step, updates scheduled in the NBA region → all flops update "simultaneously". Use for sequential logic.
- **Blocking (`=`):** executes immediately, in order. Use in combinational `always @*` / `always_comb`.
- **Shift register example:** `always @(posedge clk) begin b = a; c = b; end` → c gets a in the same cycle (one flop, b optimized) — not a 2-stage shift. With `<=` you get two flops.
- **Races:** blocking in multiple clocked blocks reading each other''s outputs → order-dependent simulation results → sim/synth mismatch.
- **Latch inference:** combinational block not assigning an output in every branch (missing else/default) → latch. Use default assignments at the top, `always_comb`, `unique case`.
- **Incomplete sensitivity lists** in old-style `always @(a or b)` → sim/synth mismatch; use `@*`.

**Follow-ups:** What hardware does `always @(posedge clk) begin x = x + 1; y = x; end` produce? `unique` vs `priority` case?','["Verilog semantics"]','["blocking","non-blocking","race condition","simulation-synthesis mismatch","latch inference"]','Easy','["AMD","NVIDIA","Intel","Qualcomm","Meta"]','both','rtl','rtl-m1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-013','RTL design','Implement a dual-port memory (one read + one write per cycle) using only single-port SRAMs. What are the options?','1. **Double-pump:** run the SRAM at 2× clock, read in one phase, write in the other. Simple; costs timing/power, needs a faster macro.
2. **Banking (even/odd or hashed):** two (or more) banks; if read and write hit different banks, both proceed. Conflicts → stall or buffer the write in a small write buffer (also checked for reads — bypass).
3. **Double-width words:** store two entries per row; for streaming (FIFOs), alternate: write a full 2-entry row every other cycle while reading on the other cycles (write data held in a staging register).
4. **Replication + live value table (LVT)** for multi-read/multi-write register files in FPGAs: 2R1W = two copies each written; nW needs LVT or XOR-based schemes.
5. **For FIFOs:** ping-pong two single-port banks: write to one while reading the other.

**Trade-offs:** area (2 macros vs 1 dual-port macro, dual-port bitcell ~1.5-2× area), latency, conflict stalls, verification complexity.

**Follow-ups:** Make the banked version conflict-free for a FIFO access pattern. How do you handle read-after-write to the same address in the same cycle?','["Memory design"]','["banking","double-pumping","single-port SRAM","read-write conflict","live value table"]','Medium','["Apple","NVIDIA","Google"]','both','rtl','rtl-m2','https://www.glassdoor.com.au/Interview/Apple-Interview-E1138-RVW11371098.htm',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-014','RTL design','Multiply an input by 63 (or 7) efficiently in hardware without a general multiplier. More generally, how do you implement constant multiplication?','- **x·63 = (x << 6) − x** → one subtractor instead of 6 adders (x·32 + x·16 + … + x).
- **x·7 = (x << 3) − x.** **x·10 = (x << 3) + (x << 1).**
- **Canonical signed digit (CSD):** recode the constant with digits {−1, 0, 1} to minimize non-zero digits → minimum adders/subtractors (63 = 1000000 − 1 → 2 non-zero digits).
- **Multiple constants (FIR filters):** share partial products (multiple-constant multiplication / common subexpression elimination).
- **Bit width:** output needs width(x) + 6 bits for ×63; signed inputs need sign extension before subtraction.
- **Squaring (also asked):** x² has symmetric partial products (a_i·a_j appears twice) → about half the partial products of a general multiplier; LSB of x² = x0, bit 1 always 0.

```verilog
assign y = ({x, 6''b0}) - {6''b0, x};   // x * 63, y is W+6 bits
```

**Follow-ups:** Divide by 3 in hardware (multiply by reciprocal 0x5555… and shift)? How many adders for ×45?','["Arithmetic"]','["shift-and-add","CSD","constant multiplication","adder tree"]','Medium','["NVIDIA","Intel","Qualcomm"]','both','rtl','rtl-m1','https://www.glassdoor.com.au/Interview/NVIDIA-Interview-E7633-RVW81156467.htm',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-rtl-015','RTL design','What is pipelining in RTL and how do you add valid/ready (backpressure) handshaking to a pipeline? Write a skid buffer.','- **Valid/ready (AXI-stream style):** transfer occurs when `valid && ready`. Source must hold data stable while `valid && !ready`; `valid` must not depend on `ready` combinationally (to avoid loops).
- **Naive backpressure:** `ready_out = ready_in` passes a long combinational path backward through all stages → timing issue.
- **Skid buffer** (2-entry): registers `ready` so the upstream path is cut; absorbs the one beat that arrives in the cycle after downstream deasserts ready → full throughput, registered ready.

```verilog
// skid buffer: in_* upstream, out_* downstream
logic        skid_v; logic [W-1:0] skid_d;
assign in_ready = !skid_v;                 // registered
always_ff @(posedge clk or negedge rst_n)
  if (!rst_n) begin out_valid <= 0; skid_v <= 0; end
  else begin
    if (in_valid && in_ready && out_valid && !out_ready) begin
      skid_v <= 1; skid_d <= in_data;      // catch the beat
    end else if (out_ready) skid_v <= 0;
    if (out_ready || !out_valid) begin
      out_valid <= skid_v || in_valid;
      out_data  <= skid_v ? skid_d : in_data;
    end
  end
```
(When `out_ready` returns, the skid entry goes out first.)

- **Throughput:** with registered ready and a 1-entry buffer you get 50%; a 2-entry skid gives 100%.

**Follow-ups:** Verify it with assertions (no data loss, order preserved). How do credit-based interfaces differ?','["Pipelining","Flow control"]','["valid/ready","backpressure","skid buffer","bubble","throughput"]','Medium','["NVIDIA","Google","Meta","Tenstorrent","Etched"]','both','rtl','rtl-m2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-dv-001','Verification','Describe the architecture of a UVM testbench. What do the driver, monitor, sequencer, scoreboard, agent and environment do?','- **Sequence item:** a transaction (randomizable fields + constraints).
- **Sequence:** generates items (stimulus scenarios); runs on a **sequencer**, which arbitrates and hands items to the **driver** (`get_next_item`/`item_done`).
- **Driver:** converts transactions to pin wiggles on a virtual interface.
- **Monitor:** passively samples the interface, rebuilds transactions, broadcasts via an analysis port (to scoreboard and coverage).
- **Agent:** sequencer + driver + monitor for one interface; active or passive (`is_active`).
- **Scoreboard:** compares DUT outputs with a reference model (predictor) — in-order or out-of-order matching.
- **Env:** agents + scoreboards + coverage collectors; **test** configures the env and starts sequences.
- **Infrastructure:** factory (`type_id::create`, overrides without editing code), `uvm_config_db` (pass virtual interfaces/config), phases (build → connect → run → extract/check/report), objections to end the run phase.
- **Why UVM:** reuse (agents across projects), configurable, constrained-random + functional coverage driven.

**Follow-ups:** How would you make agent2 issue a read every time agent1''s bad stimulus raises an error pin (virtual sequencer, event/analysis-port triggering)? Difference between `uvm_component` and `uvm_object`?','["UVM"]','["UVM agent","sequencer","driver","monitor","scoreboard","factory","config_db","TLM ports","phases"]','Medium','["AMD","NVIDIA","Intel","Meta","Tenstorrent"]','both','rtl','rtl-m5','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-dv-002','Verification','Write SystemVerilog Assertions for a valid/ready handshake: data must stay stable while valid is high and ready is low, and every request must be granted within 8 cycles.','```systemverilog
// 1) valid held until accepted, data stable while stalled
property p_hold;
  @(posedge clk) disable iff (!rst_n)
    valid && !ready |=> valid && $stable(data);
endproperty
a_hold: assert property (p_hold) else $error("valid dropped or data changed while stalled");

// 2) request granted within 1..8 cycles
property p_gnt;
  @(posedge clk) disable iff (!rst_n)
    req |-> ##[1:8] gnt;
endproperty
a_gnt: assert property (p_gnt);

// 3) grant is one-hot or zero (arbiter)
a_onehot: assert property (@(posedge clk) $onehot0(gnt_vec));

// cover the stall scenario actually happened
c_stall: cover property (@(posedge clk) valid && !ready ##1 valid && ready);
```
- `|->` overlapping (same cycle), `|=>` next cycle.
- `disable iff` for reset; sampled values come from the preponed region (no races).
- Use **cover** to prove the scenario is exercised; vacuous passes are a common pitfall.
- Same properties can be used in formal (JasperGold/VC Formal) for bounded or full proofs.

**Follow-ups:** What is a vacuous pass? Write an assertion that a FIFO never overflows.','["SVA"]','["concurrent assertion","implication","$stable","bounded liveness","disable iff"]','Medium','["NVIDIA","Apple","AMD","Intel"]','both','rtl','rtl-m5','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-dv-003','Verification','What''s the difference between code coverage and functional coverage? Write a covergroup with bins and a cross for an ALU.','- **Code coverage** (automatic): line, branch, toggle, condition/expression, FSM state/transition. Tells you what RTL was exercised, not whether features were checked.
- **Functional coverage** (written from the spec/verification plan): did we exercise the interesting scenarios, values and combinations?
- 100% code coverage with poor functional coverage = missing scenarios; high functional with low code = dead code or holes in the plan.

```systemverilog
covergroup alu_cg @(posedge clk iff valid);
  cp_op: coverpoint op { bins add = {ADD}; bins sub = {SUB}; bins mul = {MUL}; bins others[] = default; }
  cp_a : coverpoint a  { bins zero = {0}; bins max = {''1}; bins low = {[1:15]}; bins rest = default; }
  cp_ovf: coverpoint ovf;
  x_op_a: cross cp_op, cp_a;
  x_op_ovf: cross cp_op, cp_ovf { ignore_bins no_mul_ovf = binsof(cp_op.mul) && binsof(cp_ovf) intersect {1}; }
endgroup
```
- **Closure:** analyze holes → add directed tests/constraint tweaks or justify exclusions; regressions merged across seeds.

**Follow-ups:** How do you handle unreachable code coverage? Difference between `illegal_bins` and `ignore_bins`?','["Coverage"]','["code coverage","functional coverage","covergroup","bins","cross coverage","coverage closure"]','Medium','["AMD","Intel","NVIDIA","Qualcomm"]','both','rtl','rtl-m5','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-dv-004','Verification','How would you verify a write-back set-associative cache (or a round-robin arbiter)? Outline the verification plan.','**1. Features → plan:** hits/misses (read/write), allocation policy, replacement (LRU/PLRU), dirty eviction write-back, write-allocate on store miss, back-to-back same-set accesses, MSHR merging (if non-blocking), flush/invalidate, reset state, ECC/parity, coherence messages if any.

**2. Reference model:** a simple memory model (associative array) for data correctness — every read must return the last write to that address regardless of cache state. Optionally a cycle-agnostic cache model to predict hits/evictions.

**3. Stimulus:** constrained random with address constraints to hit the same set (force conflicts/evictions), streaming, random; directed tests for corner cases (evict a dirty line while a fill is outstanding, write to a line being evicted).

**4. Checkers:** scoreboard on data; assertions on protocol (no request lost, one outstanding fill per MSHR), invariants (no duplicate tags in a set, dirty only if valid).

**5. Coverage:** cross of {op} × {hit, miss-clean, miss-dirty} × {way}, replacement state transitions, MSHR full, back-pressure.

**6. Assembly-level (if at CPU level):** write programs that fill a set beyond its associativity and check results / performance counters.

**Arbiter version:** assertions for one-hot grant, grant ⊆ request, bounded wait ≤ N−1, fairness coverage (each requester granted after each other).

**Follow-ups:** How do you know you''re done (coverage closure + bug rate)? How would formal help here?','["Verification planning"]','["verification plan","reference model","scoreboard","corner cases","assertions","coverage","directed vs random"]','Medium','["AMD","NVIDIA","Apple","Intel"]','both','rtl','rtl-m5','https://www.glassdoor.com.hk/Interview/AMD-Interview-E15-RVW1452365.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-dv-005','Verification','Explain SystemVerilog constrained randomization: rand vs randc, constraint blocks, solve-before, soft constraints, and pre/post_randomize.','```systemverilog
class pkt;
  rand  bit [7:0] len;
  rand  bit [31:0] addr;
  randc bit [2:0] id;               // cycles through all values before repeating
  rand  bit is_short;
  constraint c_len { len inside {[1:64]}; }
  constraint c_dist { addr dist { [0:''hFF] := 30, [''h100:''hFFFF] :/ 70 }; }
  constraint c_align { addr[1:0] == 0; }
  constraint c_short { is_short -> len < 8; solve is_short before len; }
  constraint c_soft { soft len == 16; }   // overridable
  function void post_randomize(); /* compute CRC etc. */ endfunction
endclass
// inline: assert(p.randomize() with { len > 32; });
```
- `dist`: `:=` weight per value, `:/` weight split across the range.
- `solve before` changes probability distribution (not the solution space).
- Soft constraints yield to conflicting hard ones (useful for defaults).
- Disable with `constraint_mode(0)` / `rand_mode(0)`.
- Always check `randomize()` return value.

**Follow-ups:** Write a constraint for an array of 10 unique values summing to 100. Why can `solve before` not be used with randc?','["SystemVerilog"]','["rand","randc","constraint","dist","solve before","soft","inline constraints"]','Medium','["AMD","Meta","Intel","NVIDIA"]','both','rtl','rtl-m5','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-dv-006','Verification','Write a simple self-checking testbench for a 4-bit adder (or a FIFO) without UVM.','```systemverilog
module tb;
  logic [3:0] a, b; logic cin; logic [3:0] s; logic cout;
  int errors = 0;
  adder4 dut (.a, .b, .cin, .s, .cout);
  initial begin
    // exhaustive is feasible: 2^9 = 512 cases
    for (int i = 0; i < 512; i++) begin
      {a, b, cin} = i[8:0];
      #1;
      if ({cout, s} !== a + b + cin) begin
        errors++;
        $error("a=%0d b=%0d cin=%0d got %0d exp %0d", a, b, cin, {cout,s}, a+b+cin);
      end
    end
    if (errors == 0) $display("PASS"); else $display("FAIL: %0d errors", errors);
    $finish;
  end
endmodule
```
- For sequential DUTs (FIFO): clock generator, reset sequence, drive on negedge/sample on posedge (or clocking blocks), queue-based reference model (`q.push_back` on write, compare `q.pop_front()` on read), random wr/rd enables, check flags.
- Use `!==` to catch X/Z.

**Follow-ups:** How would you make it exhaustive for a 32-bit adder (you can''t — random + corner values + formal equivalence)? Clocking blocks and why they avoid races.','["Testbench"]','["self-checking testbench","reference model","clock generation","randomization","$display/$error"]','Easy','["Meta","AMD","Apple","Qualcomm"]','both','rtl','rtl-m5','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-comp-001','Compilers','What is MLIR and how is it different from LLVM IR? Explain dialects, operations, regions, and progressive lowering.','- **LLVM IR:** a single, fixed, low-level SSA IR (scalar/vector types, basic blocks, typed instructions). Great for CPU/GPU codegen, but high-level structure (loops as loops, tensors, parallelism) is lost.
- **MLIR:** an infrastructure for building many IRs (**dialects**) that coexist in one module. Everything is an **operation** with operands, results, attributes, and **regions** (nested blocks) → loops, functions, and kernels are first-class.
- **Progressive lowering:** e.g., `stablehlo`/`torch` → `linalg` (structured ops on tensors) → bufferization → `affine`/`scf` loops on `memref` → `vector` → `llvm`/`nvvm`/`spirv` dialect → LLVM IR. Each level keeps the information its optimizations need (tiling/fusion on linalg, polyhedral on affine).
- **Infrastructure:** ODS/TableGen to define ops, pattern rewriting (greedy, dialect conversion with type converters), pass manager, verification, interfaces (e.g., TilingInterface).
- **Used by:** IREE, Triton (GPU dialects), TPU/XLA stack (StableHLO), Tenstorrent tt-mlir, CIRCT (hardware), many accelerator vendors.

**Follow-ups:** How would you write a dialect conversion from linalg.matmul to your accelerator ops? What is bufferization and why is it hard?','["MLIR"]','["dialect","operation","region","block","progressive lowering","linalg","affine","scf","LLVM dialect"]','Medium','["NVIDIA","AMD","Google","Qualcomm","Tenstorrent","Cerebras"]','both','mlir','mlir-m1','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-comp-002','Compilers','Given an IR snippet, what optimizations would you apply? Explain SSA and classic passes: constant propagation, CSE, DCE, LICM, inlining, and their trade-offs.','- **SSA:** each value defined once; φ nodes merge at control-flow joins (MLIR uses block arguments instead). Makes def-use chains explicit → simpler analyses.
- **Constant propagation/folding (SCCP):** evaluate at compile time, also prunes unreachable branches.
- **CSE / GVN:** reuse identical computations (must respect side effects/memory).
- **DCE:** remove results with no uses and no side effects.
- **LICM:** hoist loop-invariant computations (needs proof of no side effects / safe to speculate).
- **Strength reduction & induction variable simplification:** i*4 → add 4 per iteration.
- **Inlining:** enables other optimizations; costs code size, register pressure, compile time.
- **Loop opts:** unrolling (ILP, fewer branches vs code size/register pressure — also asked at NVIDIA), vectorization, fusion/fission, interchange, tiling.
- **Trade-offs to mention when asked "most aggressive":** register pressure (GPU occupancy drops with more registers), code size/I-cache, numerical semantics (fast-math reassociation changes FP results), compile time, aliasing assumptions.

**Approach on a concrete IR:** identify invariants and redundancies, check aliasing (restrict/noalias), then loop-level transformations; state the legality condition for each.

**Follow-ups:** When is LICM illegal? How does unrolling interact with GPU occupancy?','["Compiler optimizations"]','["SSA","phi nodes","constant folding","CSE","DCE","LICM","inlining","strength reduction"]','Medium','["NVIDIA","AMD","Qualcomm","Google"]','both','mlir','mlir-m4','https://www.glassdoor.ie/Interview/NVIDIA-Interview-E7633-RVW93519039.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-comp-003','Compilers','Explain loop tiling and loop interchange. When are they legal, and how do they improve locality? Show a tiled matmul.','```c
for (ii = 0; ii < N; ii += T)
  for (kk = 0; kk < N; kk += T)
    for (jj = 0; jj < N; jj += T)
      for (i = ii; i < min(ii+T,N); i++)
        for (k = kk; k < min(kk+T,N); k++) {
          float a = A[i][k];
          for (j = jj; j < min(jj+T,N); j++)
            C[i][j] += a * B[k][j];
        }
```
- **Locality:** without tiling, B (N² elements) is streamed N times; with T×T tiles fitting in cache, each element of B is reused T times per load → traffic drops ~T×. Choose T so 3T² × elem_size ≤ cache (e.g., 32 KB L1, FP32 → T ≈ 52 → use 48 or 32 for alignment).
- **Interchange** (i-j-k → i-k-j) makes the inner loop stride-1 on both B and C → vectorizable.
- **Legality:** a transformation is legal if it preserves all data dependences: dependence distance vectors must stay lexicographically positive after reordering. Tiling is legal when the band is fully permutable (all dependence components ≥ 0) — matmul''s only dependence is the reduction on k, which is fine (assuming associativity of the reduction for reordering of k).
- **Multi-level tiling** for registers/L1/L2 and for accelerator buffers (SRAM size).

**Follow-ups:** Show a loop where interchange is illegal (e.g., A[i][j] = A[i-1][j+1]). How do you pick tile sizes automatically (analytical model vs autotuning)?','["Loop transformations"]','["tiling","interchange","dependence vectors","legality","data locality","tile size selection"]','Medium','["Google","NVIDIA","Intel","AMD","Cerebras"]','both','mlir','mlir-m2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-comp-004','Compilers','What is the polyhedral model? Explain iteration domains, access relations, dependences, and how schedules are computed.','- **Scope:** static control parts (SCoPs): loops with affine bounds and affine array subscripts.
- **Iteration domain:** each statement''s instances as integer points in a polyhedron, e.g., {S[i,j] : 0 ≤ i < N, 0 ≤ j ≤ i}.
- **Access relations:** affine maps from iterations to array elements (S[i,j] → A[i+1][j]).
- **Dependences:** pairs of instances accessing the same element with at least one write, with source before sink (exact via ILP — ISL).
- **Schedule:** an affine map from instances to multidimensional time; legal if every dependence maps to a lexicographically positive time difference. Tiling, fusion, interchange, skewing, parallelization all = choosing a schedule.
- **Pluto algorithm:** find hyperplanes minimizing dependence distance (locality) while maximizing parallel/permutable bands, then tile.
- **Tools:** ISL, PPCG (GPU codegen), Polly (LLVM), MLIR affine dialect (affine.for/affine maps, dependence analysis), Tensor Comprehensions.
- **Limits:** non-affine code (indirect access, data-dependent control), scalability of ILP, hard cost models.

**Follow-ups:** Skew a stencil loop to enable wavefront parallelism.','["Polyhedral compilation"]','["iteration domain","affine access","dependence polyhedron","schedule","Pluto","ISL","affine dialect"]','Hard','["Google","Qualcomm","NVIDIA","Intel"]','both','mlir','mlir-m2','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-comp-005','Compilers','How do you schedule operations for an accelerator with limited resources? Compare list scheduling with ILP/MIP formulations.','- **Input:** a DAG of ops with latencies; resource types with counts (MACs, vector units, banks, buses).
- **List scheduling (heuristic):** each cycle, among ready ops pick by priority (longest path to sink / critical path, mobility = ALAP − ASAP), assign to free resources. O(n log n), near-optimal often, no guarantees.
- **ILP/MIP:** binary x[o,t] = 1 if op o starts at t. Constraints: each op scheduled once (Σ_t x = 1); dependencies (start_v ≥ start_u + lat_u); resources (Σ ops of type r active at t ≤ R_r). Objective: minimize makespan (or energy, memory). Optimal but scales poorly → use for small kernels, windowed/decomposed problems, or as the gold standard to evaluate heuristics.
- **Modulo scheduling** for loops (software pipelining) — initiation interval II ≥ max(ResMII, RecMII).
- **Accelerator specifics:** memory/bank conflicts, data placement, buffer capacity, operand-row constraints in PIM (e.g., which rows/columns hold operands for MAGIC/SIMDRAM ops) → combined placement + scheduling.
be ready to state model size, solve times, and how it compares with greedy.

**Follow-ups:** How do you keep MIP tractable (time-indexed vs order-based formulations, symmetry breaking, warm start from list schedule)? What is ResMII?','["Scheduling"]','["list scheduling","ILP/MIP scheduling","resource constraints","DAG","critical path","modulo scheduling"]','Hard','["Cerebras","Tenstorrent","Qualcomm","NVIDIA","Google"]','both','mlir','mlir-m3','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-comp-006','Compilers','How does an ML compiler (XLA, TVM, Triton, torch.compile) go from a model graph to a fast kernel? What decisions does it make?','1. **Capture:** trace/symbolic graph (TorchDynamo/FX, jax.jit → StableHLO, ONNX).
2. **Graph-level:** constant folding, CSE, algebraic simplification, layout selection (NHWC vs NCHW, tensor-core friendly), **operator fusion**, memory planning (buffer reuse), sharding/partitioning (GSPMD).
3. **Lowering:** to loop-level / tile-level IR (TVM TIR, Triton, MLIR linalg/affine/vector).
4. **Kernel-level:** tiling for memory hierarchy, vectorization, tensorization (map to MMA/tensor-core intrinsics), double-buffering, thread mapping.
5. **Autotuning / cost models:** search tile sizes, unroll factors (AutoTVM/Ansor, Triton autotune).
6. **Codegen:** LLVM → PTX/AMDGPU/CPU, or vendor backends.
7. **Runtime:** CUDA graphs, dynamic shapes handling (bucketing, symbolic shapes).

**Hard problems:** dynamic shapes, fusion decisions vs recomputation, cross-kernel scheduling, new hardware with exotic memory (PIM, scratchpads) where caching assumptions break.

**Follow-ups:** Triton vs CUDA: what does the Triton compiler do for you? How would you add a new accelerator backend?','["ML compilers"]','["graph capture","graph optimizations","fusion","layout","tiling","autotuning","codegen"]','Medium','["Google","Meta","NVIDIA","AMD","Tenstorrent"]','both','mlir','mlir-m5','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-code-001','Coding & puzzles','Check whether a number is a power of two, and count the set bits in an integer. Give the bit tricks.','```c
#include <stdint.h>
#include <stdbool.h>
bool is_pow2(uint32_t n) { return n && !(n & (n - 1)); }   // n&(n-1) clears lowest set bit

int popcount(uint32_t x) {          // Kernighan: one iteration per set bit
  int c = 0;
  while (x) { x &= x - 1; c++; }
  return c;
}

int popcount_swar(uint32_t x) {     // O(1), branch-free
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0F0F0F0F;
  return (x * 0x01010101) >> 24;
}
```
- Other tricks: `x & -x` isolates the lowest set bit; `x | (x-1)` sets trailing zeros; swap without temp via XOR; check opposite signs `(a ^ b) < 0`.
- Hardware version: popcount = adder tree of bits (log depth), or `__builtin_popcount` / `POPCNT`.
- **Pitfall:** forgetting n = 0 in is_pow2; signed shifts in C.

**Follow-ups:** Round up to the next power of two. Reverse the bits of a 32-bit integer.','["Bit manipulation"]','["n & (n-1)","popcount","Kernighan","lowest set bit"]','Easy','["NVIDIA","Qualcomm","Intel","AMD"]','both','coding','','https://www.glassdoor.sg/Interview/NVIDIA-Interview-E7633-RVW41589340.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-code-002','Coding & puzzles','Explain these C declarations and keywords: const int *p vs int *const p, volatile, static, and what happens with pointer arithmetic on an int array.','- `const int *p` → pointer to const int (can''t modify *p, can move p). `int *const p` → const pointer (can modify *p, can''t reassign p). `const int *const p` → both.
- **volatile:** the value may change outside the program''s control (memory-mapped registers, ISR-shared flags) → compiler must not cache it in a register or eliminate reads/writes. Does **not** provide atomicity or memory ordering (use atomics/barriers).
- **static:** at file scope → internal linkage; in a function → persists across calls (stored in .data/.bss, initialized once); static function → file-private.
- **Pointer arithmetic:** `int a[4]; int *p = a; p + 1` advances by `sizeof(int)` bytes; `*(a + i) == a[i] == i[a]`; `&a + 1` advances by the whole array (16 bytes).
- **Classic MMIO:** `#define REG (*(volatile uint32_t *)0x40000000)`; `REG |= 1u << 3;` (read-modify-write — race with ISRs).
- `sizeof(a)` vs `sizeof(p)` when an array decays to a pointer as a function argument.

**Follow-ups:** Can a variable be both const and volatile? (Yes: a read-only status register.) What does `int (*f[10])(int)` declare?','["C language"]','["const pointer","volatile","static","pointer arithmetic","memory-mapped I/O"]','Medium','["NVIDIA","Qualcomm","Apple","Intel"]','both','coding','','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-code-003','Coding & puzzles','Reverse a singly linked list in C, then explain how you''d detect a cycle.','```c
struct node { int val; struct node *next; };

struct node *reverse(struct node *head) {
  struct node *prev = NULL, *cur = head;
  while (cur) {
    struct node *nxt = cur->next;
    cur->next = prev;
    prev = cur;
    cur = nxt;
  }
  return prev;
}

int has_cycle(struct node *h) {          // Floyd: slow 1 step, fast 2 steps
  struct node *s = h, *f = h;
  while (f && f->next) {
    s = s->next; f = f->next->next;
    if (s == f) return 1;
  }
  return 0;
}
```
- O(n) time, O(1) space. Mention edge cases: empty list, single node.
- Cycle start: after meeting, move one pointer to head; advance both by 1; they meet at the start.

**Follow-ups:** Recursive reversal and its stack cost. Reverse in groups of k.','["Data structures"]','["linked list","pointer manipulation","Floyd''s cycle detection"]','Medium','["NVIDIA","Meta","Google","Qualcomm"]','both','coding','','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-code-004','Coding & puzzles','Implement a simple LRU cache (get/put in O(1)). How does this relate to hardware cache replacement, and why do caches use pseudo-LRU?','```python
from collections import OrderedDict
class LRUCache:
    def __init__(self, cap): self.cap, self.d = cap, OrderedDict()
    def get(self, k):
        if k not in self.d: return -1
        self.d.move_to_end(k); return self.d[k]
    def put(self, k, v):
        if k in self.d: self.d.move_to_end(k)
        self.d[k] = v
        if len(self.d) > self.cap: self.d.popitem(last=False)
```
(C++: `std::list` of (key,value) + `unordered_map<key, list::iterator>`; splice to front on access.)

- **Hardware:** true LRU for N ways needs log2(N!) bits per set and complex update (8 ways → 16 bits, permutation update). **Tree-PLRU** uses N−1 bits: each access flips bits along the path to point away; victim = follow bits. Good approximation at low cost. Also NRU, RRIP (scan/thrash resistant, used in LLCs).

**Follow-ups:** Write tree-PLRU update/victim logic for 4 ways in Verilog. When is LRU pathological (loop slightly larger than cache)?','["Data structures","Caches"]','["LRU","hash map + doubly linked list","pseudo-LRU","tree-PLRU"]','Medium','["Meta","Google","NVIDIA","Apple"]','both','coding','','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-code-005','Coding & puzzles','Write a function that multiplies two matrices efficiently in C/C++ (or NumPy-free Python), and discuss cache behavior of different loop orders.','```c
// C = A (MxK) * B (KxN), row-major
void matmul(int M, int N, int K, const float *A, const float *B, float *C) {
  for (int i = 0; i < M*N; i++) C[i] = 0.f;
  for (int i = 0; i < M; i++)
    for (int k = 0; k < K; k++) {
      float a = A[i*K + k];
      for (int j = 0; j < N; j++)        // stride-1 on B and C -> vectorizes
        C[i*N + j] += a * B[k*N + j];
    }
}
```
- **i-j-k (naive):** inner loop strides B by N → a cache miss per iteration for large N.
- **i-k-j:** inner loop stride-1 for B and C; a in a register. Typically 5-10x faster than i-j-k before tiling.
- Next steps: tiling (see compilers question), SIMD intrinsics, multithreading (OpenMP over i), use `restrict` to tell the compiler no aliasing.
- Complexity: 2MNK FLOPs; mention BLAS gets ~90% of peak.

**Follow-ups:** What''s the miss rate of each loop order (Hennessy & Patterson analysis)? Transpose B instead — trade-offs?','["Performance coding"]','["loop order","stride-1 access","cache misses","row-major"]','Medium','["AMD","NVIDIA","Intel","Meta"]','both','coding','','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q-code-006','Coding & puzzles','Puzzle: You have a 2:1 mux and constants. Build an XOR, an AND, an OR and an inverter. Also, build a 128-bit adder from 64-bit adders.','**2:1 mux (y = s ? b : a) as universal logic:**
- NOT x: s = x, a = 1, b = 0.
- AND(x,y): s = x, a = 0, b = y.
- OR(x,y): s = x, a = y, b = 1.
- XOR(x,y): s = x, a = y, b = ~y (needs one inverter, itself a mux) → 2 muxes.

**128-bit adder from 64-bit adders:**
- **Ripple:** low adder''s carry-out → high adder''s carry-in. Delay ≈ 2 × T64.
- **Carry-select:** compute the high half twice (cin = 0 and cin = 1) in parallel, then pick with the low half''s carry-out → delay ≈ T64 + mux, area ≈ 3 adders.
- Mention carry-lookahead / parallel-prefix (Kogge-Stone) for log-depth.

**Follow-ups:** How many 2:1 muxes make a 4:1 mux (3)? Implement a full adder with muxes.','["Logic puzzles"]','["mux as universal gate","carry select","carry chaining"]','Medium','["NVIDIA","Apple","Intel"]','both','coding','','',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-001','Computer architecture','Follow one load instruction through an out-of-order core from fetch to retirement. Where can it stall, and what structures does it touch?','**Front end:** fetch (I-cache, I-TLB, branch predictor picks the next PC) → decode → **rename**: the destination gets a new physical register from the free list, sources read the RAT. The load gets a **ROB** entry and a **load-queue** entry (dispatch stalls if any of these is full).

**Issue:** it waits in the issue queue until its base register is ready, then computes the address in an AGU.

**Memory access (in parallel):**
- **D-TLB** lookup (miss → page walk, possibly a fault recorded in the ROB, not taken yet).
- **L1 D-cache** lookup (VIPT, so indexing overlaps translation).
- **Store-queue search** for older stores to the same address: a full match forwards the data; an older store with an unknown address means speculating (memory dependence predictor) or waiting.

**Miss path:** allocate an **MSHR** (stall if none), go to L2/LLC/DRAM. Dependents woken under load-hit speculation get replayed.

**Writeback and commit:** data returns, the physical register is written and dependents wake. The load retires only at the ROB head; then exceptions are taken precisely. A later store to the same address that resolves first → memory-ordering violation → squash from the load.

**Pitfalls:** forgetting that the load can execute before older stores, and that a fault is only *taken* at commit.','["Out-of-order execution","Caches"]','["rename","issue queue","load queue","store-to-load forwarding","TLB","MSHR","ROB commit"]','Medium','["Apple"]','both','arch','arch-p4','https://www.glassdoor.ie/Interview/Apple-Interview-E1138-RVW8497227.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-002','Computer architecture','Design the load-store queue of an out-of-order core. How do loads and stores find each other, and what happens on a memory-ordering violation?','**Store queue (SQ):** age-ordered entries with address, size and data. Stores write the cache **only after commit** (via the SQ / store buffer).

**Load issue:** search the SQ for **older** stores (an associative, age-prioritized CAM):
- Youngest older store with a matching, fully covering address → **forward** its data.
- Partial overlap → stall until that store commits (or merge bytes, if supported).
- Older store with an **unknown address** → either wait (conservative) or **speculate** using a memory dependence predictor (e.g., store sets).

**Load queue (LQ):** keeps executed loads so that when a store''s address resolves it searches **younger** loads that already executed to the same address. A hit = violation → squash from that load (or its producer) and refetch; train the predictor so the pair is ordered next time.

**Also in the LQ:** detecting snoop invalidations for loads that executed early, needed to respect the memory model (e.g., TSO load-load order).

**Costs:** the CAM search grows with queue size and ports, so it limits clock speed and size. Ideas: split by address bits, filters (bloom), or age-ordered banks.

**Numbers to quote:** a violation costs a pipeline-flush-sized penalty (tens of cycles), so the predictor should keep violations rare.','["Out-of-order execution","Memory disambiguation"]','["store queue","load queue","CAM search","store-to-load forwarding","store sets","squash and replay"]','Hard','["Apple"]','both','arch','arch-p4','https://www.glassdoor.ie/Interview/Apple-Interview-E1138-RVW8497227.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-003','Computer architecture','A 32 KB, 2-way cache with 64 B lines uses MESI. Starting empty, the core does: read 0x010F30, write 0x880F00, write 0x010F20. Which set do the accesses use, and what are the final line states?','**Geometry:** 32 KB / 64 B = 512 lines; 2-way → 256 sets. Offset = bits [5:0], index = bits [13:6], tag = the rest.

**Addresses:**
- 0x010F30 >> 6 = 0x43C → index 0x3C (**set 60**), tag 0x4.
- 0x880F00 >> 6 = 0x2203C → index 0x3C (**set 60**), tag 0x220.
- 0x010F20 is in the same 64 B line as 0x010F30 (line 0x010F00–0x010F3F): set 60, tag 0x4.

**Sequence (single core, no other sharers):**
1. Read 0x010F30: miss, fill way 0 in **E** (or **S** if another cache holds it).
2. Write 0x880F00: miss; with write-allocate, issue a read-for-ownership and fill way 1 in **M**.
3. Write 0x010F20: hit in way 0. From **E**, a silent upgrade to **M** (no bus traffic); from **S**, an upgrade/invalidate request first.

**Final:** set 60 holds both lines, both **M**; all other sets invalid. A fourth access to set 60 with a new tag would evict the LRU line, which is 0x880F00''s (way 0 was touched last), and write it back because it is dirty.

**Interviewers check:** that you compute the index correctly, notice the 2nd and 3rd accesses map to the same set, and know E allows a silent write.','["Caches","Cache coherence"]','["set index","MESI","write-allocate","RFO","silent E to M upgrade"]','Medium','["Intel"]','both','arch','arch-x2','https://static.glassdoor.de/Interview/cpu-design-engineer-interview-questions-SRCH_KO0,19_IP19.htm ; https://www.scribd.com/doc/54401527/Intel-Interview-Questions',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-004','Computer architecture','Compare inclusive, exclusive and non-inclusive (NINE) cache hierarchies. Why would a designer pick each?','**Inclusive LLC:** every line in L1/L2 is also in the LLC.
- + The LLC (or its tags) acts as a **snoop filter**: a miss in the LLC means no core has the line.
- − Duplicated capacity (effective size = LLC size), and an LLC eviction must **back-invalidate** upper copies, which can evict hot L1 lines ("inclusion victims").

**Exclusive LLC:** a line lives in exactly one level; the LLC is filled by L2 evictions (a victim cache).
- + Effective capacity = L2 + LLC; good when the LLC is not much bigger than L2.
- − Every L2 eviction moves data (bandwidth, energy); snoops need a separate directory or snoop filter.

**NINE (non-inclusive, non-exclusive):** fill both, but don''t enforce inclusion on eviction. Middle ground; coherence needs a separate snoop filter.

**Rule of thumb:** inclusive is simple when LLC ≫ sum of private caches (older Intel client parts); as private L2s grew, designs moved to non-inclusive LLCs with dedicated snoop filters.

**Follow-up to expect:** "what is an inclusion victim and how do you avoid it?" (hints from L1 hits to the LLC, or a non-inclusive design).','["Caches"]','["inclusion","back-invalidation","snoop filter","effective capacity","victim LLC"]','Medium','["NVIDIA"]','both','arch','arch-p5','https://www.glassdoor.ca/Interview/NVIDIA-Interview-RVW55374342.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-005','Computer architecture','Which cache replacement policies do you know beyond LRU? How would you make an LLC resistant to scans and thrashing?','**Baseline:** true LRU is costly beyond 4–8 ways (needs ≥ log2(N!) bits per set); **tree-PLRU** uses N − 1 bits; **NRU** keeps one bit per way; random is cheap and avoids pathological patterns.

**The LLC problem:** the LLC sees a filtered stream (L1/L2 hits never reach it). Two bad patterns:
- **Scans:** a one-time stream pushes the reused working set out under LRU.
- **Thrashing:** a cyclic working set slightly larger than the cache misses on every access under LRU.

**Fixes:**
- **Insertion policy:** insert new lines at LRU (LIP), or at MRU only occasionally (BIP), so a thrashing set keeps part of itself.
- **RRIP (SRRIP/BRRIP):** each line has a 2–3-bit re-reference prediction value; insert as "long" re-reference, promote on hit, evict lines predicted "distant". Scan-resistant at 2 bits per line.
- **Set dueling (DIP/DRRIP):** a few sample sets run each policy; a counter picks the winner for the rest.
- **PC-based predictors** (SHiP, Hawkeye): learn which load PCs bring in dead lines.

**How to evaluate:** MPKI and IPC across SPEC-like traces, plus hardware cost per line.','["Caches","Replacement"]','["LRU","tree-PLRU","NRU","RRIP","insertion policy","set dueling"]','Medium','["Qualcomm"]','both','arch','arch-p5','https://www.glassdoor.com.au/Interview/Qualcomm-Interview-E640-RVW10759512.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-006','Computer architecture','What is a non-blocking cache? Describe what an MSHR stores and what happens on primary and secondary misses.','**Non-blocking (lockup-free) cache:** keeps serving hits (hit-under-miss) and accepts more misses (miss-under-miss) while earlier misses are outstanding. Needed for OoO cores and prefetchers to create memory-level parallelism.

**MSHR (miss status holding register), one per outstanding line miss:**
- Valid bit and **line (block) address**.
- For each waiting request: destination (register tag / LSQ index), offset in the line, size, load vs store; store data may be merged.
- Status: issued, data partially returned.

**Primary miss:** no MSHR matches → allocate one and send a request to the next level.
**Secondary miss:** a later miss to the same line → append to the existing MSHR, no new request.
**Structural stall:** no free MSHR, or the matching MSHR has no free target slot.

**On fill:** data goes to the cache array (or a fill buffer), and every waiting target is serviced in order.

**Sizing:** by Little''s law, MSHRs ≥ bandwidth × latency / line size, e.g., 25.6 GB/s × 100 ns / 64 B = 40.

**Related:** write-back buffer for dirty victims, which must also be checked by later misses.','["Caches","Memory-level parallelism"]','["hit under miss","miss under miss","MSHR","primary miss","secondary miss","fill buffer"]','Medium','[]','both','arch','arch-p5','https://www.youtube.com/watch?v=_CzOaPRjt4Q',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-007','Computer architecture','Explain the TAGE branch predictor. Why geometric history lengths, and how would you evaluate a new predictor?','**Structure:** a base bimodal table (PC-indexed 2-bit counters) plus N tagged tables. Table i is indexed by a hash of the PC and the last L(i) global-history bits, with L(i) growing geometrically (e.g., 5, 9, 15, 25, 44, 76, 130...).

**Prediction:** look up all tables in parallel; the hitting table with the **longest** history is the provider, the next-longest is the alternate. A newly allocated, weak provider may defer to the alternate.

**Update:** on a mispredict, allocate an entry in a longer-history table; **useful** counters protect entries that helped, and are aged periodically so stale entries can be replaced.

**Why geometric:** a few tables cover both short and very long correlations with total storage that grows only slowly; each branch uses the shortest history that predicts it, so tables are not wasted on easy branches.

**Extensions:** loop predictor and statistical corrector (TAGE-SC-L); ITTAGE applies the same idea to indirect branch targets.

**Evaluation:** MPKI (mispredicts per 1,000 instructions) on many traces (CBP-style), storage budget, lookup latency (often overriding a fast simple predictor), and impact on IPC through the pipeline''s mispredict penalty.','["Branch prediction"]','["TAGE","geometric history","partial tags","useful bits","MPKI","ITTAGE"]','Hard','[]','both','arch','arch-p4','https://jilp.org/vol8/v8paper1.pdf',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-008','Computer architecture','Why does an in-order pipeline not reach its ideal CPI of 1? Build a CPI stack for it.','**CPI = 1 + Σ (event frequency × penalty)**. Typical components:
- **Load-use** stalls: e.g., 25% loads × 40% immediately used × 1 cycle = 0.10.
- **Branch mispredicts:** 20% branches × 5% mispredicted × 3 cycles = 0.03 (much more in deep pipelines).
- **Cache misses:** instruction and data. E.g., 30% memory ops × 2% L1 miss × 20-cycle L2 hit = 0.12; plus L2 misses to DRAM, which often dominate.
- **Structural hazards:** shared ports, a non-pipelined divider.
- **Multi-cycle ops** and long-latency FP.

**Example total:** 1 + 0.10 + 0.03 + 0.12 = 1.25 before DRAM misses.

**Ways to lower it:** forwarding and scheduling, better prediction, bigger/associative caches, prefetching, non-blocking caches, or move to superscalar/OoO to overlap stalls.

**Point to make:** in-order cores block on the first stall; OoO cores hide part of these penalties, which is the main reason to pay for them.','["Pipelining","Performance"]','["CPI stack","load-use stall","branch penalty","cache miss stall","structural hazard"]','Easy','[]','both','arch','arch-p3','https://static.glassdoor.it/Interview/architecture-interview-questions-SRCH_KO0,12_IP81.htm',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-009','Computer architecture','How does a pipelined or out-of-order processor handle exceptions and interrupts precisely? What if two instructions fault in the same cycle?','**Precise:** all older instructions completed, no younger one changed architectural state, saved PC = faulting instruction.

**In-order pipeline:** record the exception in the pipeline register as it is detected (IF: page fault on fetch, ID: illegal opcode, EX: overflow, MEM: data fault), but act on it only at a fixed point (e.g., WB or the end of MEM). Older instructions reach that point first, so the **oldest** exception wins even if a younger one was detected earlier.

**Out-of-order:** mark the exception in the instruction''s **ROB entry**; take it only when that entry reaches the ROB head. Then flush all younger instructions, restore the rename map (retirement RAT), save PC and cause, and jump to the handler.

**Two faults in the same cycle:** the older one in program order is taken; the younger is discarded and re-detected after the handler returns if it still applies.

**Interrupts:** asynchronous; the core picks a convenient instruction boundary (e.g., stops committing, flushes, saves the next PC).

**Watch out:** stores must not reach memory before they commit (store buffer), or the state would not be precise.','["Exceptions","Out-of-order execution"]','["precise exceptions","ROB","exception flag","interrupt","commit","flush"]','Medium','[]','both','arch','arch-p3','https://www.youtube.com/watch?v=TH386wzOXvA',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-010','Computer architecture','What are the costs of address translation in a modern core, and how do TLB hierarchies, page-walk caches and huge pages reduce them?','**Cost:** every access needs a translation. A TLB miss on x86-64 means up to 4 dependent memory references (5 with 5-level paging, up to 24 under nested paging for VMs).

**Mitigations:**
- **TLB hierarchy:** small L1 I/D TLBs (tens of entries, fast), a larger unified L2 TLB (~1–2K entries).
- **Page-walk caches** (MMU caches): hold upper-level entries so most walks need only the last level; walks also hit in the data caches.
- **Huge pages (2 MB / 1 GB):** raise **reach** (e.g., 1,536 entries × 2 MB = 3 GB vs 6 MB with 4 KB pages) and shorten walks. Costs: fragmentation, compaction, coarse protection.
- **ASIDs/PCIDs:** avoid flushing on context switches.
- **Hardware walkers** that run in parallel with execution, and prefetching translations.

**Costs on the OS side:** TLB shootdowns via IPIs when mappings change.

**For accelerators:** an IOMMU/SMMU translates device addresses, and large pages matter even more for big tensors.','["Virtual memory","TLB"]','["L1/L2 TLB","page-walk cache","huge pages","TLB reach","nested paging","TLB shootdown"]','Medium','[]','both','arch','arch-p5','https://www.youtube.com/watch?v=pPQjdD6br4I',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-011','Computer architecture','How are atomic read-modify-write operations implemented in a multicore with private caches? Compare LL/SC and CAS, and explain how to build an efficient spin lock.','**Mechanism:** the core gets the line in **M** (exclusive) and holds it for the read and write, delaying or NACKing incoming snoops so no other write interleaves. No bus lock is needed for cacheable memory.

**CAS:** write new value if memory equals expected; returns old value. Single instruction (x86 `lock cmpxchg`, Arm LSE `CAS`). Suffers from **ABA** (value went A→B→A).

**LL/SC:** LL loads and sets a reservation on the line; SC succeeds only if no write to the line has happened since. Retry on failure. No ABA, but can **livelock** and spuriously fail (eviction, interrupt).

**Spin locks:**
- **Test-and-set loop:** every attempt is a write → the line ping-pongs in M among waiters.
- **Test-and-test-and-set:** spin on a plain load (line in S everywhere), try the atomic only when it reads free. Add **exponential backoff** to avoid a storm at release.
- **Queue locks (MCS/ticket):** each waiter spins on its own line; fair and scalable.

**Memory ordering:** lock acquire needs acquire semantics, release needs release semantics (or fences on weak models).','["Synchronization","Cache coherence"]','["atomic RMW","LL/SC","CAS","ABA","test-and-test-and-set","backoff"]','Medium','[]','both','arch','arch-x2','https://www.youtube.com/watch?v=vN8xRnjT8wA',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-012','Computer architecture','Design a directory-based coherence protocol for a 64-core chip. How much storage does the directory need, and how would you reduce it?','**Basics:** each line has a **home** node (address-interleaved) whose directory entry holds the state (I/S/M or MESI-like) and the sharers. Requests go to the home; it forwards invalidations or requests point-to-point, no broadcast.

**Transactions:**
- Read miss, line clean: home replies with data (2 hops).
- Read miss, line M at owner: requester → home → owner → requester (**3 hops**), owner downgrades to S/O.
- Write miss with sharers: home sends invalidations; acks are collected (by requester or home) before the write completes.

**Storage (full bit vector):** 64 bits per 64 B line = 12.5% of memory, too much for all of DRAM.

**Reductions:**
- **Sparse directory / snoop filter:** track only lines present in some cache (sized ~1–2× total private-cache lines); evicting an entry invalidates its sharers.
- **Limited pointers** (e.g., 4 core IDs) with broadcast on overflow, or **coarse vectors** (1 bit per cluster).
- Hierarchical directories for chiplets/sockets.

**Hard parts:** races and **transient states** (requests crossing in the network), deadlock avoidance via separate virtual networks for requests, forwards and responses, and verifying it all (model checking).','["Cache coherence","Directory"]','["full bit vector","sparse directory","snoop filter","home node","3-hop transaction","transient states"]','Hard','[]','both','arch','arch-x2','https://www.youtube.com/watch?v=T2LxWfefhsc',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-013','Computer architecture','You are writing a performance model. Design a stride prefetcher for the L1/L2 and say which metrics you would report and how you would keep it from hurting performance.','**Table (reference prediction table):** indexed by load PC (or a hash). Entry: tag, last address, last stride, 2-bit confidence/state (init → transient → steady).

**Training:** on each access by that PC, new stride = addr − last addr. Same stride → raise confidence; different → lower it and update the stride.

**Issue:** in steady state, prefetch addr + d·stride ... addr + (d + k − 1)·stride (**distance** d covers latency, **degree** k per trigger). Drop prefetches that hit in the cache or an MSHR; give them lower priority than demand misses.

**Metrics:**
- **Accuracy** = useful / issued.
- **Coverage** = misses removed / baseline misses.
- **Timeliness:** fraction of useful prefetches that were late (demand arrived while still in flight).
- Extra **bandwidth** and **pollution** (demand misses caused by prefetched lines evicting useful ones). Ultimately IPC.

**Protecting performance:** feedback-directed throttling (adjust d, k by accuracy/lateness/pollution), insert prefetched lines at low priority in the replacement stack, stop at page boundaries (physical addresses), and cap outstanding prefetches.

**Modeling notes:** model MSHR occupancy and DRAM contention, or the prefetcher looks too good.','["Prefetching","Performance modeling"]','["reference prediction table","confidence","distance and degree","accuracy","coverage","timeliness","throttling"]','Hard','["Qualcomm"]','both','arch','arch-x2','https://www.glassdoor.com.au/Interview/Qualcomm-Interview-E640-RVW10759512.htm',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-014','Computer architecture','Explain Spectre and Meltdown. What do they say about speculative execution, and what are the hardware mitigations?','**Core insight:** squashed instructions don''t change architectural state, but they do change **microarchitectural** state (caches, TLBs, predictors), which can be measured with timing.

**Spectre v1 (bounds-check bypass):** train the predictor so `if (x < len)` predicts taken, call with an out-of-bounds x; the speculative load reads a secret and uses it to index a probe array; then time probe-array accesses (Flush+Reload).

**Spectre v2 (branch target injection):** poison the indirect-branch predictor so victim code speculatively jumps to an attacker-chosen gadget.

**Meltdown:** on affected cores, a user load to a kernel address forwarded data to dependents before the permission check squashed it.

**Mitigations:**
- Software: `lfence`/speculation barriers, index masking, retpolines; KPTI (separate kernel page tables) for Meltdown.
- Hardware: permission checks before forwarding data (fixes Meltdown), predictor isolation/flush across privilege levels (IBRS/IBPB/eIBRS), and research ideas such as delaying the visibility of speculative loads in the cache.

**Interview angle:** the cost is performance; mitigations limit speculation exactly where it helps.','["Speculation","Security"]','["Spectre v1","Spectre v2","Meltdown","cache side channel","fences","IBRS","KPTI"]','Medium','[]','both','arch','arch-x2','https://www.youtube.com/watch?v=tyYOsCpbK0E',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-015','Computer architecture','How does a systolic array compute a matrix multiply? Compare weight-stationary and output-stationary dataflows, and when does a systolic array lose to a GPU?','**Idea:** an R × C grid of MAC units; operands enter at the edges and move to a neighbor each cycle, so each value fetched from SRAM is reused across a full row or column. Only local wires, no shared register file.

**Weight-stationary (TPU-style):** preload a tile of W into the PEs; activations stream in from the left, partial sums flow down and exit at the bottom. Good when the same weights are applied to many inputs (large batch / many tokens).

**Output-stationary:** each PE accumulates one output element; A streams right and B streams down. Partial sums never move, which saves accumulator traffic.

**Costs and limits:**
- **Fill/drain:** about R + C cycles of pipeline latency per tile; small matrices waste them.
- **Shape mismatch:** a dimension smaller than the array (e.g., batch-1 GEMV, depthwise conv) leaves PEs idle.
- Only dense, regular math; non-GEMM ops need vector units.

**vs GPU tensor cores:** GPUs schedule many small MMA tiles from registers and shared memory, handle irregular ops flexibly, but spend more energy on register-file and data movement per MAC.

**Rule:** array utilization ≈ (useful MACs) / (R·C·cycles); check it for your layer shapes.','["Systolic arrays","Accelerators"]','["weight stationary","output stationary","data reuse","fill/drain","utilization"]','Medium','["Google"]','both','arch','arch-p4','https://www.jointaro.com/jobs/google/tpu-architect-silicon-c4519e0e',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-016','Computer architecture','How would you tile a matrix multiply to use a 32 KB L1 data cache? Pick a tile size and estimate the reduction in memory traffic.','**Naive C = A·B (N × N, doubles):** the inner loop walks a column of B, so for large N almost every B access misses; traffic is about N³ elements.

**Blocking:** split into b × b tiles and compute C_tile += A_tile · B_tile. The three tiles must fit in L1:
3 · b² · 8 B ≤ 32 KB → b² ≤ 1,365 → b ≤ 36. Choose **b = 32** (24 KB), leaving room for other data and conflict slack.

**Traffic:** each tile of A and B is loaded N/b times, so memory traffic ≈ 2N³/b + N² elements instead of ~N³. With b = 32 that is about a **16× reduction**.

**Arithmetic intensity:** about 2b³ FLOPs per 2b² loaded elements → b/8 FLOP/byte for doubles at the tile level (grows with b).

**Practical points:**
- Power-of-two row pitches can map tile rows to the same sets: pad the leading dimension or copy tiles into contiguous buffers.
- Multi-level tiling: registers (micro-kernel), L1, L2, LLC, as BLAS libraries do.
- On GPUs the same idea uses shared memory and registers.','["Caches","Locality"]','["blocking","tiling","working set","arithmetic intensity","conflict misses"]','Medium','[]','both','arch','arch-p6','https://www.youtube.com/watch?v=5ybhEMPUFok',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-017','Computer architecture','A kernel runs at low occupancy. How do you compute occupancy, what limits it, and is maximum occupancy always the goal?','**Occupancy** = active warps per SM / maximum warps per SM. It is limited by the tightest of:
- **Registers:** e.g., 65,536 registers / 64 per thread = 1,024 threads = 32 warps → 50% if the SM allows 64.
- **Shared memory:** e.g., 100 KB available / 40 KB per block = 2 blocks.
- **Threads/blocks per SM** limits and block size (a block of 100 threads uses 4 warps, the last one mostly empty).

**Fixes:** cap registers (launch bounds) at the risk of spills to local memory; reduce shared memory per block; choose block sizes that are multiples of 32 and divide the SM limits evenly.

**Not always the goal:** occupancy is a means to hide latency. A kernel with high **ILP** (several independent loads per thread, register-tiled GEMM) can saturate bandwidth or tensor cores at 25–50% occupancy; forcing more warps can cause spills and lower performance.

**How to decide:** profile (achieved occupancy, stall reasons, memory throughput vs peak). If memory throughput is far below peak and stalls are "long scoreboard", raise bytes in flight (more warps or more loads per thread). Little''s law: bytes in flight ≈ bandwidth × latency.','["GPUs","Occupancy"]','["registers per thread","shared memory per block","max warps per SM","ILP","latency hiding"]','Medium','["NVIDIA"]','both','gpu','gpu-g2','https://www.techinterview.org/post/3233475452/how-nvidia-tests-cuda-and-gpu-skills/',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-018','Computer architecture','Write an efficient matrix transpose on a GPU. Why is the naive version slow, and how do shared memory and padding fix it?','**Naive:** `out[x][y] = in[y][x]` with threads indexed along x. Reads are coalesced (consecutive x), but writes go to consecutive rows: stride N, so each warp''s store touches 32 different sectors.

**Tiled version:**
1. A block loads a 32 × 32 tile from `in` with coalesced reads into shared memory `tile[ty][tx]`.
2. `__syncthreads()`.
3. It writes the transposed tile to `out` reading `tile[tx][ty]`, so the global writes are coalesced.

**Bank conflicts:** reading `tile[tx][ty]` walks a column; with 32 banks of 4 bytes and a row pitch of 32 words, every thread hits the same bank: a **32-way** conflict. **Pad** to `tile[32][33]`: the column stride becomes 33 (odd), so all 32 threads hit different banks.

**Further:** each thread handles several elements (e.g., 32 × 8 threads for a 32 × 32 tile) to raise work per thread; compare achieved bandwidth with a plain device-to-device copy as the upper bound.

**What interviewers listen for:** coalescing explained in sectors/transactions, the padding trick, and measuring against peak bandwidth.','["GPUs","Memory coalescing"]','["coalescing","shared-memory tile","bank conflict","padding","strided access"]','Medium','["NVIDIA"]','both','gpu','gpu-g2','https://www.techinterview.org/post/3233475452/how-nvidia-tests-cuda-and-gpu-skills/',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-arch-019','Computer architecture','How does a GPU handle a branch where threads in a warp diverge? Explain the reconvergence stack and what changed with independent thread scheduling.','**SIMT basics:** a warp shares one instruction stream; an **active mask** says which lanes execute.

**Classic SIMT stack (pre-Volta):** at a divergent branch, push entries (PC, mask) for each path plus the **reconvergence PC**, usually the branch''s immediate post-dominator. Run one path with its mask, then the other, then pop and continue with the full mask. Cost: the paths run serially; a 50/50 if/else of equal length halves throughput in that region. Nested divergence multiplies the effect.

**Problem:** threads in the same warp could not wait on each other; an intra-warp spin lock could deadlock because the waiting path might run forever before the lock holder''s path.

**Independent thread scheduling (Volta onward):** each thread keeps its own PC and stack; the scheduler can interleave diverged paths and makes forward progress guarantees. Reconvergence is no longer implicit, so code uses `__syncwarp()` and `*_sync` shuffles/votes with explicit masks.

**Reducing divergence:** make branch conditions warp-uniform (sort or bin work), use predication for short branches, move divergence to block level.','["GPUs","SIMT"]','["active mask","SIMT stack","reconvergence point","immediate post-dominator","independent thread scheduling","__syncwarp"]','Hard','[]','both','gpu','gpu-g1','https://docs.nvidia.com/cuda/cuda-c-programming-guide/',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-001','Memory systems & PIM/CIM','DDR4-3200 with 22-22-22 timings (CL-tRCD-tRP). Compute the latency of a row hit, an access to a closed bank, and a row conflict. What is the average with a 60% hit rate, and when is a closed-page policy better?','**Clock:** 3,200 MT/s → 1,600 MHz → tCK = 0.625 ns. 22 cycles = **13.75 ns** each.

**Latencies (to first data, ignoring burst and controller):**
- Row hit: CL = **13.75 ns**.
- Closed (precharged) bank: tRCD + CL = **27.5 ns**.
- Row conflict: tRP + tRCD + CL = **41.25 ns**.

**Open-page, 60% hits, 40% conflicts:** 0.6 × 13.75 + 0.4 × 41.25 = 8.25 + 16.5 = **24.75 ns**.

**Closed-page:** every access is 27.5 ns (precharge is hidden after the previous access).
Break-even: 13.75h + 41.25(1 − h) = 27.5 → **h = 0.5**. Above 50% row hits open-page wins; below it (random, many-core interleaved traffic) closed-page or an adaptive timeout policy wins.

**Add for realism:** burst time (BL8 at 0.3125 ns per beat = 2.5 ns), controller and PHY latency, queueing, and tRAS (a row must stay open at least tRAS before precharge).

**Follow-up:** tRC = tRAS + tRP sets the back-to-back conflict rate to one bank, so spreading traffic over banks matters more than single-access latency.','["DRAM","Timing"]','["tCK","CL","tRCD","tRP","open-page","closed-page","break-even hit rate"]','Medium','[]','both','arch','arch-x1','https://vlsiweb.com/ddr-interview-questions/',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-002','Memory systems & PIM/CIM','Walk through the DRAM commands for a read and the timing constraints between them. Why do tRRD and tFAW exist, and how do they limit random-access bandwidth?','**Commands:** ACTIVATE (row → sense amps/row buffer) → after **tRCD** → READ (column) → data after **CL**, burst of BL beats → PRECHARGE (close row) no earlier than **tRAS** after ACT (and tRTP after the read) → next ACT to the same bank after **tRP**. **tRC = tRAS + tRP** per bank.

**Column-to-column:** tCCD_S (different bank group) < tCCD_L (same group), because groups share less internal circuitry; controllers alternate bank groups.

**Bus turnaround:** tWTR (write→read), tRTW (read→write), so writes are batched.

**tRRD and tFAW:** an ACT draws a large current spike. tRRD spaces ACTs to different banks; tFAW allows at most 4 ACTs per rank in a rolling window. Both protect power delivery and noise.

**Bandwidth effect:** if every access needs a new row (random 64 B lines), at most 4 lines per tFAW per rank can be activated. Example: tFAW = 20 ns → 200 M ACT/s × 64 B = **12.8 GB/s** per rank, well below a DDR5-6400 channel''s 51.2 GB/s peak. Row-buffer locality, more ranks/channels, and smarter address mapping recover it.','["DRAM","Timing"]','["ACT","RD","PRE","tRAS","tRC","tRRD","tFAW","tCCD","tWTR","bank groups"]','Medium','[]','both','arch','arch-x1','https://vlsiweb.com/ddr-interview-questions/',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-003','Memory systems & PIM/CIM','Design a DRAM memory controller: what queues and scheduling policy would you use, how do you handle writes and refresh, and how do you keep it fair across cores?','**Front end:** address mapping (channel/rank/bank group/bank/row/column; XOR-hash bank bits to break stride conflicts), then per-bank or shared **read and write queues** (writes buffered, reads that hit pending writes are forwarded).

**Command scheduler (each cycle):** pick among commands that satisfy all timing constraints (tRCD, tRP, tRAS, tCCD_S/L, tRRD, tFAW, turnarounds).
- Baseline **FR-FCFS**: row hits first, then oldest. Maximizes throughput.
- **Page policy:** open, closed, or adaptive (close after a timeout or when no queued hits remain).

**Writes:** drain in batches when the write queue passes a high watermark (or reads are idle) to amortize tWTR/tRTW; stop at a low watermark.

**Refresh:** issue REF every tREFI; postpone up to the allowed limit when busy and catch up when idle; per-bank/same-bank refresh to keep other banks working. Also RowHammer mitigation commands (RFM/PRAC back-off in DDR5).

**Fairness:** FR-FCFS starves low-locality threads. Options: **PAR-BS** (batch oldest requests, rank threads within a batch), **ATLAS** (prioritize least attained service), **BLISS** (blacklist threads with many consecutive hits), or QoS priorities for real-time agents (display, GPU).

**Metrics:** bandwidth utilization, average/tail read latency, per-thread slowdown (weighted speedup, max slowdown).','["Memory controller","DRAM"]','["read/write queues","FR-FCFS","write drain","refresh scheduling","address mapping","PAR-BS","BLISS","QoS"]','Hard','[]','both','arch','arch-x1','https://www.youtube.com/watch?v=PL9i3PgYpnw',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-004','Memory systems & PIM/CIM','What changed from DDR4 to DDR5, and why? Cover channel structure, burst length, banks, refresh, ECC and power delivery.','**Channel:** one 64-bit DDR4 channel per DIMM → **two independent 32-bit subchannels** (40-bit with ECC). More, narrower channels raise concurrency.

**Burst:** BL8 → **BL16**, so a 32-bit subchannel still delivers **64 B per burst** = one cache line.

**Banks:** 16 banks in 4 groups (x4/x8 DDR4) → **32 banks in 8 groups** for 16 Gb DDR5. More bank-level parallelism; tCCD_L vs tCCD_S still matter.

**Refresh:** tREFI 7.8 µs → **3.9 µs** (32 ms window) and **same-bank refresh**, which refreshes one bank per group while the rest keep working.

**Speed:** 3,200 MT/s top JEDEC DDR4 → 4,800–6,400+ MT/s in DDR5, which needs **decision-feedback equalization** in the receivers and more training.

**Reliability:** **on-die ECC** (SEC over 128 data bits + 8 check bits) to absorb cell-level failures in dense dies; it is invisible to the host, so system ECC is still needed. DDR5 also added mitigations for RowHammer (RFM, later PRAC).

**Power:** a **PMIC on the DIMM** regulates voltages locally (1.2 V → 1.1 V VDD), improving power integrity at higher speeds.','["DRAM","DDR5"]','["subchannels","BL16","bank groups","same-bank refresh","on-die ECC","PMIC","DFE"]','Medium','[]','both','arch','arch-x1','https://vlsiweb.com/ddr-interview-questions/',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-005','Memory systems & PIM/CIM','Compare SECDED and chipkill ECC for DRAM. How do on-die ECC, rank-level ECC, link CRC and scrubbing fit together in a server memory system?','**SECDED (72,64):** 8 check bits per 64 data bits (12.5%), corrects any 1-bit error, detects 2. A whole-chip failure (4 or 8 bits wrong) can be miscorrected or missed.

**Chipkill:** symbol-based code (Reed-Solomon / SSC-DSD) where each DRAM chip supplies one symbol; corrects all errors within one chip, detects two bad chips. Easier with x4 chips (4-bit symbols); classically uses wider (or lockstepped) channels, so it costs bandwidth or overfetch.

**Layers in a server:**
- **On-die ECC** (DDR5, LPDDR, HBM): corrects single-bit cell errors inside the chip, invisible to the host; improves yield/retention but is not end-to-end and can alias multi-bit errors.
- **Rank-level ECC** in the controller (SECDED or chipkill) on the 72/80-bit bus.
- **Link protection:** write CRC on DDR (detects bus errors, retry); HBM and CXL have their own link ECC/CRC.
- **Scrubbing:** patrol scrubs correct latent errors before they pair up; demand scrubbing on read.
- **Error logging, page retirement** (OS offlines pages with repeated corrected errors).

**Vocabulary:** CE (corrected), DUE (detected uncorrectable → machine check), SDC (silent corruption, the worst). Design goal: turn SDC into DUE, DUE into CE.','["ECC","DRAM reliability"]','["SECDED (72,64)","chipkill","Reed-Solomon symbols","on-die ECC","link CRC","patrol scrub","DUE vs SDC"]','Hard','[]','both','arch','arch-x1','https://www.youtube.com/watch?v=uqV-43ysc44',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-006','Memory systems & PIM/CIM','Implement a (72,64) SECDED encoder and decoder in hardware. What is the critical path, and how does the code-word width trade off overhead against latency and partial writes?','**Encoder:** each of the 8 check bits is the XOR of a fixed subset of the 64 data bits (one row of the parity-check matrix H). Pure XOR trees: ~log2(fan-in) levels (≈5–6 levels of 2-input XOR for ~30-input trees).

**Decoder:**
1. Recompute check bits from received data, XOR with received check bits → 8-bit **syndrome** (one XOR-tree level deeper).
2. Compare the syndrome against each of the 72 H columns (72 small AND/compare decoders) → flip the matching bit.
3. Classify: zero → OK; matches a column → single error, corrected; non-zero and not a column (in a **Hsiao** code, even-weight syndrome) → double error flagged.
Critical path: XOR tree → syndrome decode → correction XOR → output mux. Often a pipeline stage, or the data is forwarded speculatively and squashed on an error.

**Hsiao vs Hamming:** Hsiao uses odd-weight columns with balanced row weights, so trees are shallower and double errors are detected by syndrome parity.

**Width trade-off:** SEC(DED) check bits grow with log2 of the data width:
- 64 data bits: 8 bits (12.5%); 128: 9 (7.0%); 256: 10 (3.9%).
Wider words cut overhead but deepen trees and force **read-modify-write** for writes smaller than the code word (read, merge, re-encode), which costs bandwidth and latency. That''s why on-die DDR5 ECC uses 128-bit words internally.','["ECC","RTL design"]','["parity-check matrix","XOR tree","syndrome","Hsiao code","read-modify-write","check-bit overhead"]','Medium','[]','both','arch','arch-x1','https://www.youtube.com/watch?v=uqV-43ysc44',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-007','Memory systems & PIM/CIM','Design a RowHammer mitigation for a memory controller. How would you track aggressor rows with limited storage, and how does this compare with in-DRAM schemes like TRR and PRAC?','**Goal:** before any row reaches the RowHammer threshold T within a refresh window (64 or 32 ms), refresh its neighbors (or throttle it).

**Budget:** a bank can do ~tREFW / tRC ≈ 64 ms / 45 ns ≈ 1.4 M activations per window. With T in the low thousands, hundreds of rows per bank could cross T.

**Options at the controller:**
- **PARA:** on each ACT, refresh neighbors with small probability p. Stateless; p must grow as T falls, costing performance.
- **Counter-based (Graphene):** a Misra-Gries frequent-item table per bank with roughly (ACTs per window / threshold) entries guarantees any row exceeding the threshold is tracked; refresh neighbors when a counter crosses T/2 (or similar margin). Area grows as T shrinks.
- **Throttling** (BlockHammer): delay ACTs to rows that are being hammered.

**Complications:** the controller does not know the internal row remapping; the **blast radius** may exceed ±1 rows (half-double); **RowPress** induces flips with long row-open times, so count open time too.

**In-DRAM:**
- **TRR:** vendor-specific sampling of a few aggressors; bypassed by many-sided patterns (TRRespass).
- **PRAC (DDR5):** per-row activation counters inside the DRAM plus an alert back-off that asks the controller for time to refresh victims. Accurate, but adds timing overhead per ACT.

**Defense in depth:** ECC helps but is not sufficient (multi-bit flips).','["RowHammer","DRAM reliability"]','["activation threshold","Misra-Gries counters","Graphene","PARA","TRR","PRAC","RowPress","blast radius"]','Hard','[]','both','arch','arch-x1','https://arxiv.org/abs/1903.11056',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-008','Memory systems & PIM/CIM','How can DRAM itself compute (processing-using-memory)? Explain how Ambit gets bitwise operations and how SIMDRAM builds addition from them. What are the latency and data-layout costs?','**Ambit primitives:**
- **RowClone:** activate a source row then a destination row in the same subarray; the sense amplifiers copy the data (bulk copy/initialize without the bus).
- **Triple-row activation (TRA):** open three rows at once; each bitline settles to the **majority** of the three cells. With a control row of 0s → AND, of 1s → OR.
- **NOT:** a dual-contact cell row captures the inverted value from the sense amplifier''s other side.
Operands are first copied into reserved compute rows (the operation destroys them).

**SIMDRAM:** any operation is written as a MAJ/NOT circuit (e.g., a full adder: carry = MAJ(a, b, c_in), sum from MAJ/NOT). Data uses a **vertical (bit-serial) layout**: bit i of many elements sits in row i, so one row operation processes a whole row of elements (e.g., 65,536 lanes for an 8 KB row).

**Costs:**
- **Latency:** an n-bit add needs O(n) row operations, each about a row cycle (tens of ns), so one add takes microseconds; throughput comes from the width.
- **Layout:** data must be **transposed** to the vertical format (by a transposition unit or software), and operands must be in the same subarray.
- Limited to simple, data-parallel ops; multiplication is O(n²) row operations.

**Where it pays:** bulk bitwise ops, database scans/bitmaps, low-precision element-wise math on huge arrays.','["PIM","Processing using memory"]','["RowClone","triple-row activation","MAJ","dual-contact cell","vertical layout","bit-serial","transposition"]','Hard','[]','both','arch','arch-x1','https://www.youtube.com/watch?v=XUZHVrlmCCU',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-009','Memory systems & PIM/CIM','What is UPMEM''s PIM architecture and programming model? Which workloads ran well on it in published characterizations, and which did not?','**Hardware:** standard DDR4 DIMMs with a **DPU** (DRAM processing unit) per 64 MB bank: an in-order, multithreaded (up to 24 tasklets) 32-bit core at a few hundred MHz, a 64 KB **WRAM** scratchpad, 24 KB instruction memory, DMA between MRAM (the bank) and WRAM. Thousands of DPUs per server.

**Programming:** C with an SDK. The host copies inputs to each DPU''s MRAM, launches the kernel, and copies results back. Tasklets move data MRAM→WRAM in DMA chunks and compute there.

**Limits:**
- **No direct DPU-to-DPU communication**: exchanges go through the host and are slow.
- Integer add/logic are native, but **32-bit multiply, division and floating point are emulated** and slow.
- Tasklets must be ≥ ~11 to fill the pipeline.

**Results (PrIM benchmarks):** good scaling and speedups over CPUs for **memory-bound, regular kernels with little inter-DPU communication**: vector add, select, unique, scans, histogram (small), GEMV with integer data. Poor fit: kernels needing **frequent global synchronization** or exchange (e.g., some graph algorithms, BFS), and **floating-point-heavy** or multiply-heavy work.

**Takeaway for an interview:** PIM wins when data movement dominates and the computation is simple and partitionable.','["PIM","Processing near memory"]','["DPU","MRAM","WRAM","tasklets","host-DPU transfers","inter-DPU communication"]','Medium','[]','both','arch','arch-x1','https://arxiv.org/abs/2105.03814',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-010','Memory systems & PIM/CIM','In an analog compute-in-memory crossbar, estimate the ADC requirements for a 128 × 128 array with 4-bit weights and 8-bit inputs. How do bit slicing and ADC sharing change the cost?','**Mapping:** weights → conductances; inputs → row voltages/pulses; each column current = dot product (Ohm + Kirchhoff).

**Full-precision ADC (naive):** 128 rows × 8-bit input × 4-bit weight → max sum 128 × 255 × 15 ≈ 490,000 → ~19 bits. Not practical.

**Bit slicing:**
- **Inputs bit-serial:** apply 1 bit per cycle (8 cycles), shift-and-add digitally.
- **Weights sliced:** e.g., 4-bit weights as 4 one-bit columns (or 2 two-bit cells), combined by shift-and-add.
- Then each column sum is at most 128 (1-bit × 1-bit × 128 rows) → **8-bit ADC** (129 levels). With 2-bit cells: max 3 × 128 = 384 → 9 bits.

**Cost:** ADC energy/area grows roughly exponentially with resolution, and conversions now happen per input bit per physical column: with 1-bit weight slices the 128 physical columns hold 32 four-bit weights per row, and one MVM takes 128 columns × 8 input cycles = 1,024 conversions. ADCs often take most of the macro''s energy and area.

**Reductions:** activate fewer rows at once (e.g., 32 → 6-bit ADC, more cycles); share one ADC across several columns via muxes (time-multiplexing); exploit sparse/low sums to use lower resolution and accept small errors; train with noise-aware/quantization-aware methods.

**Other non-idealities:** IR drop, device variation, drift, and limited on/off ratio, which also bound useful precision.','["CIM","Analog computing"]','["crossbar MVM","bit slicing","bit-serial inputs","ADC resolution","shift-and-add","ADC sharing"]','Hard','[]','both','arch','arch-x1','https://www.youtube.com/watch?v=D89ae39HwOY',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-011','Memory systems & PIM/CIM','How does compute-in-SRAM work? Compare digital and analog SRAM CIM, and explain what multi-row activation does to cell stability.','**Bitline computing:** precharge BL/BLB and raise two wordlines; BL stays high only if both cells hold 1 (**AND**), BLB only if both hold 0 (**NOR**); XOR follows from both. Sense amps plus small per-column logic give bit-serial add/multiply across all columns at once (compute caches, Neural Cache).

**Digital CIM:** read weights bit-by-bit (often via a separate read port) and multiply with 1-bit inputs using AND gates and **adder trees** beside each column group. Exact, scales with logic nodes, deterministic; cost is area for the adder trees.

**Analog CIM:** many rows at once accumulate charge or current on a shared line (current-, charge- or time-domain); an ADC digitizes the sum. Very high TOPS/W and density, but limited by variation, noise, and **ADC cost**.

**Stability:** activating several rows on the same bitlines means a cell may see a bitline pulled low by another cell, a strong read disturb that can flip a 6T cell. Fixes: lower wordline voltage/short pulses, **8T/10T cells with decoupled read ports** (the storage node never connects to the compute bitline), or charge-domain designs with capacitors per cell.

**Trade-off summary:** digital = accuracy and robustness; analog = efficiency at low precision.','["CIM","SRAM"]','["multi-row activation","bitline computing","read disturb","8T/10T cells","adder tree","charge-domain MAC"]','Medium','[]','both','arch','arch-x1','https://www.youtube.com/watch?v=Ji2Tu7Oktaw',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-012','Memory systems & PIM/CIM','Why can bank-level PIM (e.g., GDDR6-AiM or HBM-PIM) deliver more bandwidth to its compute units than the memory''s external pins? Show with numbers.','**Idea:** every bank reads a wide chunk from its row buffer each column cycle. Normally only one bank at a time can send data out through the narrow external interface. If each bank has its own MAC unit, **all banks compute in parallel** on their local data.

**Illustrative numbers (assumed, for the arithmetic):**
- External: a x32 device at 16 Gb/s per pin = 32 × 16 / 8 = **64 GB/s**.
- Internal: 16 banks, each delivering 32 B per 1 ns column access = 16 × 32 B/ns = **512 GB/s**, i.e., **8×** the pins.

**GEMV mapping (AiM-style):** each bank holds rows of the weight matrix; the input vector is **broadcast** once into a global buffer; one all-bank command makes every bank''s unit multiply-accumulate its weights with the vector; small per-row results go out through the pins. The weights never cross the external bus.

**Costs:** MAC units in a DRAM process are slow and area-expensive (lower density); data must be laid out per bank; refresh and timing constraints (tFAW-like power limits) cap how many banks run at once; programming and host coordination.

**When it matters:** LLM decode GEMV (≈1 FLOP/B) is bandwidth-bound, so internal bandwidth translates almost directly into speedup.','["PIM","Processing near memory"]','["internal bank bandwidth","all-bank mode","GEMV","global buffer","pin bandwidth"]','Medium','["SK hynix"]','both','arch','arch-x1','https://ai-infra-summit.com/node/22301 ; https://www.youtube.com/watch?v=XUZHVrlmCCU',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-013','Memory systems & PIM/CIM','What is CXL-attached memory, and how would you use it in a server or AI system? Discuss latency, bandwidth, coherence and tiering.','**What:** a Type 3 CXL device is a memory controller with DRAM behind a PCIe-PHY link. The host maps it as ordinary load/store memory (CXL.mem), usually as a CPU-less NUMA node.

**Why:** more capacity and bandwidth per socket than the DIMM slots allow, reuse of cheaper or older DRAM, and **pooling/sharing** across hosts through switches to reduce stranded memory.

**Costs:**
- **Latency:** an extra link and controller hop, roughly comparable to or more than a remote-socket NUMA access (on the order of 100+ ns extra).
- **Bandwidth:** an x16 link carries less than several local DDR5 channels.

**Using it well (tiering):** keep hot pages in local DRAM, cold pages in CXL memory; the OS or hardware profiles accesses (accessed bits, sampling) and migrates pages. Interleaving local + CXL can raise total bandwidth for bandwidth-bound jobs.

**Coherence:** CXL.cache lets devices (Type 1/2) cache host memory coherently; Type 3 memory is host-managed; multi-host sharing needs the newer coherence features (back-invalidation).

**AI angle:** capacity tier for KV caches, embeddings and optimizer states, while HBM keeps the bandwidth-critical working set.','["CXL","Memory hierarchy"]','["CXL.mem","Type 3 device","memory expansion","pooling","NUMA","tiering","hot/cold pages"]','Medium','[]','both','arch','arch-x1','https://www.youtube.com/watch?v=GhcInKOsDqk',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-014','Memory systems & PIM/CIM','How does a NAND-flash SSD work internally? Explain the FTL, garbage collection, wear leveling and write amplification, and the trade-offs of SLC/TLC/QLC.','**Media:** cells store charge (floating gate or charge trap); bits per cell: SLC 1, MLC 2, TLC 3, QLC 4. Read and program per **page** (KBs); erase per **block** (MBs). No in-place overwrite.

**FTL (flash translation layer):** maps logical block addresses to physical pages, writes out of place, and marks old copies invalid.

**Garbage collection:** pick blocks with many invalid pages, copy the valid pages elsewhere, erase the block. Those copies cause **write amplification** = NAND writes / host writes (e.g., 300 GB / 100 GB = 3). Over-provisioning and TRIM lower it.

**Wear leveling:** blocks survive limited program/erase cycles, so spread writes (including moving static cold data).

**Reliability:** strong ECC (LDPC), read-retry with shifted reference voltages, read disturb and retention management, refresh of old data.

**SLC vs TLC/QLC:** more bits per cell = more density and lower cost, but narrower voltage margins → slower programs, more errors, lower endurance. SSDs use an SLC cache region to absorb bursts.

**Interview hook:** SSD performance depends on parallelism across channels/dies/planes and on keeping GC off the critical path.','["Flash","Storage"]','["page/block","erase before write","FTL","garbage collection","write amplification","wear leveling","over-provisioning"]','Medium','[]','both','arch','arch-x1','https://www.youtube.com/watch?v=3QxunKWbNiI',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-mem-015','Memory systems & PIM/CIM','Compare PCM, STT-MRAM and ReRAM as alternatives to DRAM or SRAM, and as devices for compute-in-memory.','**PCM:** chalcogenide switches between amorphous (high R) and crystalline (low R) by heating. + Dense, multi-level, nonvolatile. − Slow, high-energy writes (especially SET), limited endurance (~10^8–10^9), resistance drift. Used as storage-class memory; for analog CIM, drift must be compensated.

**STT-MRAM:** magnetic tunnel junction; parallel vs antiparallel magnetization. + Fast, high endurance, nonvolatile, CMOS-compatible (embedded NVM replacing eFlash, last-level cache candidate). − Lower density than DRAM, write current/energy, small on/off ratio (bad for analog CIM; better for binary/digital).

**ReRAM:** a conductive filament forms or ruptures in an oxide. + Simple, very dense 1T1R or crossbar, multi-level, good for **analog MVM**. − Device-to-device and cycle-to-cycle variability, limited endurance, sneak paths in selector-less crossbars.

**How to choose:**
- Replace DRAM main memory: capacity per cost and endurance matter (PCM-class).
- Replace SRAM caches: speed and endurance (STT-MRAM, with write-energy concerns).
- CIM: high on/off ratio, multi-level and linear programming (ReRAM, PCM), plus robust periphery (ADCs).

**Systems view:** nonvolatility enables instant-on and power gating; limited endurance needs wear leveling, as in flash.','["Emerging memory","CIM"]','["phase-change memory","MTJ","filamentary switching","endurance","write energy","multi-level cells","nonvolatility"]','Medium','[]','both','arch','arch-x1','https://www.youtube.com/watch?v=D89ae39HwOY',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-001','ML accelerators & ML systems','Given a conv or GEMM layer, how would you choose between weight-stationary, output-stationary and row-stationary dataflows, and how would you evaluate the choice?','**Frame it as a loop nest.** The layer is 7 nested loops (N, K, C, R, S, P, Q). A dataflow fixes which operand stays in the PE (its indices are absent from the innermost loops), which loops are spread across PEs, and the tile sizes at each memory level.

**Match the dataflow to the reuse the layer offers**
- **Weight-stationary (TPU-style):** best when each weight is reused many times (large P*Q or batch). Bad for batch-1 FC/decode (M = 1, so the array never fills).
- **Output-stationary:** partial sums never leave the PE. Good when the reduction (C*R*S) is long and psum traffic would dominate.
- **Row-stationary (Eyeriss):** balances all three kinds of reuse in the register file. Usually lowest total energy for conv, but needs more complex control and NoC multicast.

**Evaluate quantitatively**
1. Count accesses per level (DRAM, GLB, NoC, RF) for the mapping and multiply by per-access energy (Horowitz-style table or Accelergy). DRAM at about 1-2 nJ per 64 bits dominates.
2. Get latency from utilization: fill/drain, folding when K or C doesn''t divide the array, and bandwidth stalls (roofline per level).
3. Search mappings (Timeloop) rather than hand-picking, and compare energy-delay product.

Say this in one sentence, then go back to the general answer.

**Follow-ups:** What changes for depthwise conv? For attention with a long context? How does sparsity change the best dataflow?','["Dataflow","Mapping"]','["weight stationary","output stationary","row stationary","loop nest","Timeloop","energy per access"]','Medium','[]','both','accel','accel-x1','https://arxiv.org/abs/1703.09039 (Sze et al., Efficient Processing of DNNs: tutorial and survey)',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-002','ML accelerators & ML systems','Using rough 45 nm energy numbers, estimate the energy of a 3x3 conv layer (64 to 64 channels, 56 x 56 output, INT8) and show where it goes.','**Compute:** MACs = 64 * 64 * 9 * 56 * 56 = **115.6 M**. An INT8 MAC is about 0.2 pJ (mult) + 0.03 pJ (add) = 0.23 pJ, so **about 26.6 uJ**.

**DRAM with perfect reuse (each byte moved once):**
- weights 36,864 B; inputs 58 * 58 * 64 = 215,296 B (padded); outputs 56 * 56 * 64 = 200,704 B; total about 453 KB = 56,608 64-bit accesses
- at 1.3-2.6 nJ each: **about 74-147 uJ**, already **3-5x the MAC energy** even with ideal reuse.

**No register-level reuse (every MAC reads its weight and input from a 32 KB SRAM):**
- 20 pJ per 64-bit read is 2.5 pJ/B; 2 B per MAC is 5 pJ, so 115.6 M * 5 pJ = **about 578 uJ, about 22x the MAC energy**.

**Conclusion:** arithmetic is the cheap part. The design goal is to keep operands in PE registers and small local buffers (row-stationary style), to size the global buffer so each DRAM byte is fetched once, and to cut bits moved (quantization, compression).

That cuts on-chip SRAM use and data movement; the paper reports 15.1% lower energy and 11.4% lower latency.

**Pitfalls:** quoting DRAM energy per bit vs per access inconsistently; forgetting the output writes; ignoring leakage of large SRAMs.','["Energy modeling","Data movement"]','["Horowitz energy table","MAC energy","SRAM energy","DRAM energy","data reuse"]','Hard','[]','both','accel','accel-x1','https://pages.cs.wisc.edu/~markhill/restricted/isscc2014_horowitz_power_scaling.pdf (Horowitz, ISSCC 2014, Fig. 1.1.9)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-003','ML accelerators & ML systems','How would you add sparsity support to a systolic-array accelerator? Compare 2:4 structured sparsity with unstructured sparsity.','**Start with what you want to save:** energy only (gating) or cycles too (skipping).

**Level 1, zero gating:** detect a zero activation (common after ReLU) and don''t toggle the multiplier or the read. Cheap and it saves energy, but no speedup.

**Level 2, 2:4 structured (weights):**
- Store 2 of every 4 weights plus 2-bit indices: FP16 goes from 64 to 36 bits (1.78x), INT8 from 32 to 20 bits (1.6x).
- In the PE, a 4:2 mux uses the indices to pick the matching activations. The array shape and dataflow stay the same; you get 2x effective MACs per cycle with predictable timing.
- Accuracy is usually recovered by pruning plus fine-tuning.

**Level 3, unstructured:**
- Higher sparsity is possible (70-90% for some layers), but it needs compressed formats (CSR or bitmap), index matching or intersection, and output scatter. Work per PE varies, so there is **load imbalance**; systolic lock-step timing breaks.
- Designs move to output-stationary or Cartesian-product PEs (SCNN, EIE) with queues and crossbars. The area and energy overhead only pays off at high sparsity.

**Evaluate:** effective throughput = dense peak * speedup * utilization; add the metadata bandwidth; check the break-even sparsity.

**Follow-ups:** activation sparsity is dynamic: how do you compress it on the fly? How does sparsity interact with quantization (fewer bits make the metadata relatively more expensive)?','["Sparsity","Accelerator design"]','["2:4 sparsity","metadata","zero skipping","load imbalance","compressed formats"]','Hard','[]','both','accel','accel-x1','https://arxiv.org/abs/2104.08378 (Accelerating Sparse DNNs, NVIDIA 2:4) ; https://arxiv.org/abs/1703.09039 (Sze et al., Efficient Processing of DNNs: tutorial and survey)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-004','ML accelerators & ML systems','Design the number-format and quantization path of an inference accelerator: INT8 vs FP8 vs block-scaled FP4 (MX/NVFP4), where the scales live, the accumulator width and requantization.','**Formats**
- **INT8:** q = round(x/s) + z. Weights per-output-channel symmetric; activations per-tensor or per-token. The MAC is int8 x int8 with **INT32 accumulation** (safe for about 2^17 worst-case products).
- **FP8:** E4M3 (max 448) for weights and activations, E5M2 (max 57,344) for gradients. It still needs per-tensor scales, but outliers hurt less.
- **Block-scaled FP4:** MXFP4 uses 32 elements with an E8M0 scale (**4.25 bits**); NVFP4 uses 16 elements with an E4M3 scale plus a per-tensor FP32 scale (**4.5 bits**; 4.5078 at N = 4096). Smaller blocks and non-power-of-two scales track local ranges better.

**Datapath**
1. Multiply the narrow mantissas (FP4 E2M1 products are tiny; they can even be LUT-based).
2. Add the block exponents or apply the scale **once per block dot-product**, not per element.
3. Accumulate in FP32 (or a wide fixed-point adder tree).
4. Epilogue: multiply by the per-channel or per-tensor scales, add the bias, apply the activation, requantize to the next layer''s format, with saturation and round-to-nearest-even.

**Where the scales live:** next to the weight tiles in the GLB (MX: 1 byte per 32 elements), streamed with the data so no separate fetch stalls the array.

**Trade-offs to say aloud:** accuracy (activation quantization usually dominates), area (an FP4 multiplier is much smaller than BF16), bandwidth (4.5 vs 16 bits is about 3.6x fewer bytes for weight-bound decode).

The paper found B = 16 a practical accuracy/storage trade-off, and that activation quantization dominates accuracy.','["Quantization","Number formats","MAC design"]','["per-channel scale","MXFP4","NVFP4","INT32 accumulation","requantization","E4M3"]','Hard','[]','both','accel','accel-x1','https://arxiv.org/abs/2106.08295 (Nagel et al., white paper on NN quantization) ; https://arxiv.org/abs/2310.10537 (Microscaling data formats for deep learning ; OCP MX v1.0)',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-005','ML accelerators & ML systems','Size the on-chip SRAM and the DRAM bandwidth for a 128 x 128 BF16 systolic array at 1 GHz running a large GEMM with double buffering.','**Peak:** 128 * 128 MACs * 2 FLOPs * 1 GHz = **32.8 TFLOP/s**.

**Tile choice:** output tile 128 x 128, K-chunk Kt = 512.
- A panel: 128 * 512 * 2 B = 128 KiB; B panel: 128 KiB.
- Double-buffered: 2 * (128 + 128) = **512 KiB**.
- FP32 accumulators: 128 * 128 * 4 B = **64 KiB**.
- Total about **576 KiB** (round up for banking and the epilogue).

**Intensity:** 2 * 128 * 128 * 512 FLOPs / (2 B * (128 * 512 + 512 * 128)) = 16.8 M / 262 KB = **64 FLOP/B** (the same as 2TmTn/(b(Tm + Tn))).

**DRAM bandwidth to stay compute-bound:** 32.8e12 / 64 = **512 GB/s**. If you only have about 200 GB/s, grow the output tile (256 x 256 gives 128 FLOP/B, so 256 GB/s needed) at the cost of more SRAM, or add an L2 that reuses panels across tiles.

**SRAM port bandwidth:** 256 B/cycle of activations in and 512 B/cycle of FP32 psums out, so bank the buffers (e.g., 8-16 banks with 32-64 B ports).

**Follow-ups:** what if M = 1 (decode)? Then intensity is about 1 FLOP/B and the array is bandwidth-bound whatever the tile. How would you overlap the weight preload with compute?','["Buffer sizing","Roofline"]','["double buffering","tile intensity","ridge point","SRAM banking"]','Medium','[]','both','accel','accel-x1','https://jax-ml.github.io/scaling-book/ (How to Scale Your Model) ; https://arxiv.org/abs/1811.02883 (SCALE-Sim)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-006','ML accelerators & ML systems','Compare the memory design points of TPU, MTIA, Groq and Cerebras. Where do the weights live, and what workload is each built for?','| Design | Compute core | Weights live in | Built for |
|---|---|---|---|
| TPU v1 | 256x256 WS systolic, 92 TOPS INT8 | DDR3, 34 GB/s (28 MiB on-chip for activations and accumulators) | datacenter inference; memory-bound on MLPs and LSTMs |
| TPU v4 | MXUs, 275 TFLOP/s BF16 | HBM; OCS-connected 4,096-chip pods | training at scale, plus SparseCores for embeddings |
| MTIA v1/v2 | 8x8 PE mesh with RISC-V cores | 128/256 MB SRAM + LPDDR5 | recommendation inference: big tables, cheap capacity |
| Groq LPU | statically scheduled VLIW-like chip | 230 MB SRAM only, up to 80 TB/s | low-latency batch-1 inference; models span many chips |
| Cerebras WSE-3 | 900K cores on a wafer | 44 GB on-wafer SRAM (21 PB/s); weights streamed from MemoryX for big training | huge on-chip bandwidth, single-device scaling |

**The common thread:** bytes per FLOP and capacity decide everything. Decode-heavy LLM serving wants bandwidth (SRAM or HBM), recommendation wants capacity (LPDDR), training wants HBM plus a fast network.

**Say what you''d ask next:** what is the target batch, the model size, and the latency SLO? Those set SRAM vs HBM.','["Accelerator design points","Memory hierarchy"]','["HBM","on-chip SRAM","LPDDR","wafer-scale","weight streaming","deterministic scheduling"]','Medium','["Groq"]','both','accel','accel-x2','https://arxiv.org/abs/1704.04760 (In-datacenter performance analysis of a TPU) ; https://ai.meta.com/blog/meta-training-inference-accelerator-AI-MTIA/ ; https://groq.com/wp-content/uploads/2022/10/GroqChip%E2%84%A2-Processor-Product-Brief-v1.5.pdf ; https://cerebras.net/chip/ ; https://www.techinterview.org/post/3233476417/groq-interview-compiler-inference-roles/ (third-party guide: KV cache sizing, on-chip SRAM, tiling, batching, lock-free ring buffers)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-007','ML accelerators & ML systems','Roofline drill: a chip has 400 TFLOP/s and 2 TB/s. Classify these kernels and give the attainable throughput: (a) BF16 ReLU, (b) BF16 GEMV 4096 x 4096, (c) BF16 GEMM 4096^3, (d) BF16 GEMM with M = 64, K = N = 4096.','**Ridge** = 400e12 / 2e12 = **200 FLOP/B**.

- **(a) ReLU:** 1 FLOP per 4 B = 0.25 FLOP/B, memory-bound: 0.25 * 2 TB/s = **0.5 TFLOP/s**. Fuse it.
- **(b) GEMV:** 2 * 4096^2 FLOPs / (2 * 4096^2 B weights) = about **1 FLOP/B**, so **about 2 TFLOP/s** (0.5% of peak). This is decode.
- **(c) GEMM 4096^3:** with ideal reuse, intensity = 2N^3 / (3 * 2N^2) = N/3 = **about 1365 FLOP/B**, compute-bound at **400 TFLOP/s** (if the tiling achieves the reuse).
- **(d) M = 64:** MNK/(MK + KN + MN) = 64 * 4096 / (64 + 4096 + 64) = **about 62 FLOP/B**, memory-bound: about **124 TFLOP/s**. Batch M of about 220 or more is needed to cross the ridge (solve M*4096/(2M + 4096) = 200).

**Then say what moves a kernel right:** tiling and reuse, fusion, batching, lower precision (halving the bytes doubles the intensity).

**Pitfall:** using total FLOPs over *all* bytes touched, including cache hits; the roofline uses the bytes from the level you''re bounding (DRAM/HBM here).','["Roofline","Performance modeling"]','["arithmetic intensity","ridge point","memory-bound","compute-bound"]','Easy','["Cerebras"]','both','accel','accel-x1','https://doi.org/10.1145/1498765.1498785 (Williams, Waterman, Patterson: Roofline) ; https://www.techinterview.org/post/3233476421/how-cerebras-interviews-engineers-wafer-scale/ (third-party guide: roofline, arithmetic intensity, tiling)',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-008','ML accelerators & ML systems','How would you parallelize a large matrix multiply across a 2D grid of cores (e.g., 8 x 8), each with private SRAM, connected by a mesh NoC?','**Decompose C (M x N) into an 8 x 8 grid of output blocks**; core (i, j) owns C_ij and keeps it in local SRAM as an FP32 accumulator (output-stationary at the core level).

**Stream K in panels (SUMMA):** for each K-panel k
1. the cores holding panel k of A **broadcast A_ik along row i**, and the cores holding panel k of B **broadcast B_kj down column j** (row/column multicast on the mesh);
2. each core does C_ij += A_ik * B_kj with its local matrix engine;
3. **double-buffer**: receive panel k + 1 while computing panel k.

**Cannon''s algorithm** is the alternative: a pre-skew, then nearest-neighbor shifts (A left, B up) every step. It needs only neighbor links, which suits a mesh or torus without multicast.

**Sizing:** per core, the traffic per K-panel is (M/8 + N/8) * Kp elements for 2 * (M/8)(N/8) * Kp FLOPs, the same T/b intensity rule as on one chip. Check that the NoC link bandwidth covers it.

**When M is small (decode) or K is huge:** use **split-K**: each core reduces a slice of K and then a reduction tree or all-reduce combines the partial results. This keeps all cores busy when the output is tiny.

**Other points:** load balance with ragged edges, a DMA engine per core so compute never waits, and a deterministic schedule if the hardware allows it (Groq-style).

**Follow-up:** how would you map this onto a GPU? (Threadblocks as cores, shared memory as SRAM, L2 as the "NoC".)','["GEMM parallelization","Tiling","NoC"]','["2D block decomposition","SUMMA","Cannon","multicast","double buffering","split-K"]','Hard','["NVIDIA","Cerebras","Groq"]','both','accel','accel-x1','https://www.glassdoor.ca/Interview/NVIDIA-Interview-E7633-RVW21689603.htm (NVIDIA DL architect interview report: parallelize matrix multiplication) ; https://www.techinterview.org/post/3233476421/how-cerebras-interviews-engineers-wafer-scale/ (third-party guide: roofline, arithmetic intensity, tiling) ; https://www.techinterview.org/post/3233476417/groq-interview-compiler-inference-roles/ (third-party guide: KV cache sizing, on-chip SRAM, tiling, batching, lock-free ring buffers)',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-009','ML accelerators & ML systems','Design the on-chip network for a DNN accelerator with 256 PEs. Mesh, torus or crossbar? How do you handle weight broadcast and partial-sum reduction?','**Traffic first:** DNN traffic is not uniform random. It is mostly (1) **multicast** of weights or activations to a row, column or all PEs, (2) **reduction** of partial sums, and (3) neighbor forwarding in systolic designs.

**Options for 16 x 16 PEs**
- **Crossbar:** any-to-any in one hop, but area grows with N^2, so it is too big at 256 ports. It is fine within a small cluster.
- **2D mesh:** cheap and short wires; average distance about 2k/3 = about 10.7 hops for k = 16; bisection 16 links each way. Add multicast support (tree-based routing or row/column buses).
- **Torus:** average about k/2, double the bisection, but longer wraparound wires (fold the layout).
- **Hierarchical:** clusters of PEs on a local crossbar or bus, with a mesh between clusters. **Eyeriss v2''s hierarchical mesh** adapts between high reuse (broadcast) and low reuse (unicast, high bandwidth), which matters for compact models.

**Reductions:** do them in-network (adder trees on the way to the buffer) or spatially accumulate along PE chains; this avoids N separate writes.

**Evaluate** with the per-layer bandwidth demand (bytes per cycle per PE), latency under load, and area/energy per bit-hop.','["NoC","Accelerator design"]','["mesh","torus","bisection bandwidth","multicast","reduction tree","hierarchical mesh"]','Medium','[]','both','accel','accel-x1','https://arxiv.org/abs/1807.07928 (Eyeriss v2) ; https://arxiv.org/abs/1703.09039 (Sze et al., Efficient Processing of DNNs: tutorial and survey)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-010','ML accelerators & ML systems','Derive the parameter count and per-token FLOPs of a decoder-only transformer, then estimate how long it takes to train a 7B model on 2T tokens on 1,000 H100s.','**Parameters per layer:** attention Wq, Wk, Wv, Wo = 4d^2; MLP (4d hidden) = 8d^2, so **12d^2**. Total about 12*L*d^2 plus V*d embeddings. Check: L = 32, d = 4096 gives 6.4B (+ embeddings gives Llama-2-7B scale).

**FLOPs per token:** forward about **2P** (a multiply-add per weight) plus attention 4*n*d per layer (it matters once n > 6d); training about **6P** (backward = 2x forward).

**Training estimate:**
- C = 6 * 7e9 * 2e12 = **8.4e22 FLOPs**
- 1,000 H100 * 989 TFLOP/s * 40% MFU = 3.96e17 FLOP/s
- time = 2.1e5 s = **about 59 h, about 2.5 days**

**Memory side:** 16 B/param for mixed-precision Adam is 112 GB of model states, so shard (ZeRO-3 or FSDP) or use TP within a node, plus activation checkpointing.

**Talk about MFU:** where do the other 60% go? Communication not overlapped, pipeline bubbles, attention and elementwise kernels, data loading, failures and restarts.

**Follow-ups:** how does GQA change the parameter count (smaller Wk/Wv)? How does Chinchilla (about 20 tokens per parameter) compare with 2T tokens for 7B (about 286 tokens per parameter, deliberately over-trained for cheap inference)?','["Transformer math","Training compute"]','["12Ld^2","6ND","MFU","attention FLOPs"]','Medium','[]','both','mlsys','mlsys-l1','https://arxiv.org/abs/2001.08361 (Kaplan et al., scaling laws) ; https://blog.eleuther.ai/transformer-math/',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-011','ML accelerators & ML systems','KV-cache sizing: compare MHA, GQA and MLA, then estimate how many concurrent 8K-context users fit on one 80 GB GPU serving Llama 3 8B in BF16.','**Formula:** KV bytes per token = 2 (K and V) * layers * kv_heads * head_dim * bytes.
- **MHA** (Llama 2 7B, 32 KV heads): 2 * 32 * 32 * 128 * 2 = **512 KiB/token**
- **GQA** (Llama 3 8B, 8 KV heads): 2 * 32 * 8 * 128 * 2 = **128 KiB/token** (4x smaller)
- **MLA** (DeepSeek-V2): 576 elements per token per layer (512 latent + 64 RoPE key), like GQA with 2.25 groups

**Capacity drill (Llama 3 8B, BF16):**
- weights: 8.0B * 2 B = **about 16 GB**
- free: 80 - 16 = 64 GB, minus about 5-10 GB for activations, CUDA graphs and fragmentation, so **about 55 GB**
- per user at 8K: 128 KiB * 8192 = **1 GiB**
- **about 50 concurrent users** (an upper bound of about 59 with zero overhead)

**Levers:** FP8 KV gives about 2x users; PagedAttention keeps waste under 4% (instead of reserving the max length); prefix caching shares system prompts; sliding-window or MLA-style architectures shrink the cache itself.

**Bandwidth side:** at 50 users x 8K, each decode step reads about 50 GiB of KV plus 16 GB of weights, so the KV now dominates the per-step bytes.','["KV cache","Capacity planning"]','["KV bytes per token","GQA","MLA","PagedAttention","KV quantization"]','Medium','["Groq"]','both','mlsys','mlsys-l3','https://arxiv.org/abs/2407.21783 (Llama 3 herd of models) ; https://arxiv.org/abs/2405.04434 (DeepSeek-V2, MLA) ; https://www.techinterview.org/post/3233476417/groq-interview-compiler-inference-roles/ (third-party guide: KV cache sizing, on-chip SRAM, tiling, batching, lock-free ring buffers)',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-012','ML accelerators & ML systems','Design an LLM serving stack that meets TTFT and TPOT SLOs under bursty traffic. Discuss batching, chunked prefill, prefill/decode disaggregation, prefix caching and admission control.','**Define the targets:** TTFT (prefill plus queueing) and TPOT/ITL (decode step time), at p50 and p99. Optimize **goodput**, the requests per second that meet both.

**Building blocks**
1. **Continuous batching** with **PagedAttention**: admit and retire requests every iteration; the KV lives in blocks, so memory sets the batch size, not the worst-case length.
2. **Chunked prefill:** cap the tokens per iteration (for example 512-2048), mixing prefill chunks with decodes, so a 32K prompt cannot stall everyone''s next token.
3. **Disaggregation** (DistServe/Splitwise style): separate prefill GPUs (compute-bound, big batches of tokens) from decode GPUs (memory-bound, many sequences), ship the KV over NVLink or RDMA. Each pool is tuned to its own SLO.
4. **Prefix caching** (RadixAttention): reuse the KV for shared system prompts and chat history; it cuts TTFT.
5. **Admission control and priority:** when KV memory or the SLO budget runs out, queue or preempt (swap or recompute the KV) instead of slowing everyone down; shortest-job-first for TTFT.
6. **Speculative decoding** at low load (spare compute), turned off at high load.

**Numbers to reason with:** decode step time is about (weight bytes + total KV bytes) / BW, so more users means more KV bytes and slower TPOT. Prefill time is about 2P * prompt_tokens / (peak * MFU).

**Metrics to watch:** queue depth, KV utilization, preemption rate, tail latency.','["LLM serving","Scheduling"]','["TTFT","TPOT","continuous batching","chunked prefill","disaggregation","goodput","p99"]','Hard','["Groq"]','both','mlsys','mlsys-l2','https://arxiv.org/abs/2401.09670 (DistServe) ; https://arxiv.org/abs/2403.02310 (Sarathi-Serve, chunked prefill) ; https://arxiv.org/abs/2312.07104 (SGLang / RadixAttention) ; https://arxiv.org/abs/2309.06180 (vLLM / PagedAttention) ; https://www.techinterview.org/post/3233476417/groq-interview-compiler-inference-roles/ (third-party guide: KV cache sizing, on-chip SRAM, tiling, batching, lock-free ring buffers)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-013','ML accelerators & ML systems','Explain speculative decoding. Why is it lossless, how much speedup should you expect, and when does it stop helping?','**Idea:** a cheap draft model proposes gamma tokens; the target model scores all gamma + 1 positions in **one** forward pass. Decode is memory-bound (reading the weights dominates), so checking gamma + 1 tokens costs about the same as generating 1.

**Lossless:** accept draft token x with probability min(1, p(x)/q(x)). On rejection, resample from norm(max(0, p - q)). The output distribution is exactly the target''s p.

**Expected tokens per target pass:** E = (1 - alpha^(gamma+1)) / (1 - alpha).
- alpha = 0.8, gamma = 4: (1 - 0.328)/0.2 = **3.36**
- alpha = 0.5, gamma = 4: (1 - 0.031)/0.5 = **1.94**

Speedup is about E / (1 + gamma * c), where c is the draft cost relative to the target.

**When it stops helping**
- **Large batches:** decode becomes compute-bound, so verifying gamma + 1 tokens per sequence is no longer free.
- **Low acceptance:** a weak draft model or high-temperature sampling.
- **Memory:** the draft model and its KV take capacity.

**Variants:** self-drafting heads (Medusa, EAGLE), n-gram/prompt lookup, tree verification.

**Hardware angle:** it trades spare FLOPs for fewer weight reads, the same memory-wall lever as batching or PIM.','["Speculative decoding","LLM inference"]','["draft model","acceptance rate","rejection sampling","memory-bound decode"]','Medium','[]','both','mlsys','mlsys-l2','https://arxiv.org/abs/2211.17192 (Leviathan et al., speculative decoding)',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-014','ML accelerators & ML systems','How does a Mixture-of-Experts layer work, what systems problems does it create (memory, all-to-all, load balance), and what does it mean for inference hardware?','**Mechanism:** the FFN is replaced by E experts. A router (a linear layer plus softmax) picks the top-k per token, and the output is the gate-weighted sum. Mixtral 8x7B: E = 8, k = 2, **46.7B total / 12.9B active** parameters.

**Training-side problems**
- **Load balance:** an auxiliary loss (Switch: alpha * N * sum f_i * P_i) plus a capacity factor; overflow tokens are dropped and pass through the residual.
- **Expert parallelism:** experts sit on different devices, so each MoE layer needs **two all-to-alls** (dispatch and combine), which are network-bound and sensitive to skew.

**Inference-side problems**
- **Capacity:** all experts must be resident (47B worth of memory for 13B of compute per token).
- **Decode bandwidth:** at batch 1 only k experts are read per token (good), but at a large batch nearly all experts are touched every step, so the bytes per step approach the full model.
- **Small per-expert batches:** each expert sees B * k / E tokens, giving poor GEMM utilization. Group tokens per expert (grouped GEMM).

**Hardware implications:** favors big memory capacity (HBM or tiered memory: SN40L keeps many experts in DDR and caches the active ones in HBM), fast all-to-all fabrics, and good small-batch efficiency.

**Follow-ups:** expert-choice routing; shared experts (DeepSeek); predicting experts ahead of time to prefetch.','["MoE","Distributed systems"]','["top-k routing","expert parallelism","all-to-all","capacity factor","load-balancing loss"]','Hard','[]','both','mlsys','mlsys-l1','https://arxiv.org/abs/2401.04088 (Mixtral of Experts) ; https://arxiv.org/abs/2101.03961 (Switch Transformer)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-015','ML accelerators & ML systems','Write the online-softmax merge of two partial attention results and use it to explain FlashAttention tiling and split-KV (Flash-Decoding) for long-context decode.','**State per query row:** running max m, running denominator l, unnormalized output o.

**Merge (m1, l1, o1) with (m2, l2, o2):**
```
m  = max(m1, m2)
l  = l1*exp(m1-m) + l2*exp(m2-m)
o  = o1*exp(m1-m) + o2*exp(m2-m)
final output = o / l
```
For a single new block: m2 = max of its scores s, l2 = sum exp(s - m2), o2 = sum exp(s - m2) * v.

**Numeric check:** scores {2, 4} then {6}: l = (e^-2 + 1) * e^-2 + 1 = **1.1536** = e^-4 + e^-2 + e^0.

**FlashAttention:** loop over K/V blocks that fit in SRAM; for each Q block compute S = QK^T on chip, update (m, l, o) with the merge, and never write the N x N matrix to HBM. HBM traffic drops from Theta(Nd + N^2) to Theta(N^2 d^2 / M). The backward pass recomputes S from the saved (m, l).

**Split-KV for decode:** with one query per sequence and a long KV, a single block-row can''t fill the GPU. Split the KV into chunks, have each threadblock produce (m_i, l_i, o_i), then **reduce with the same merge**. It is associative, so the reduction is a tree.

**Hardware tie:** the same merge lets PIM or near-memory units compute partial attention locally and send back only (m, l, o), a few bytes per head instead of the KV.','["Attention kernels","Online softmax"]','["running max","log-sum-exp","tiling","split-KV","IO complexity"]','Hard','[]','both','gpu','gpu-g4','https://arxiv.org/abs/1805.02867 (Milakov and Gimelshein, online softmax) ; https://arxiv.org/abs/2205.14135 (FlashAttention) ; https://crfm.stanford.edu/2023/10/12/flashdecoding.html (Flash-Decoding)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-016','ML accelerators & ML systems','You must train a 70B model on 64 GPUs (8 nodes x 8, 80 GB each). Choose a parallelism plan (DP/TP/PP/ZeRO) and justify it with memory and communication numbers.','**Memory first:** model states = 16 B * 70e9 = **1.12 TB**, which is impossible per GPU and needs about 14+ GPUs just for states.

**Plan A, 3D parallelism (Megatron style)**
- **TP = 8 within a node** (NVLink): 2 all-reduces per layer in the forward pass are too chatty for inter-node links, so keep them inside the node.
- **PP = 4 across nodes:** each stage holds 1/32 of the model; states are about 1.12 TB / 32 = 35 GB per GPU before activations.
- **DP = 2** across the remaining factor (with ZeRO-1 to shard the optimizer: 12 of the 16 B are optimizer state, so per GPU that is about 35 - 13 = about 22 GB of states).
- **Bubble:** with m = 32 microbatches, (p-1)/(m+p-1) = 3/35 = **about 9%**; use the interleaved schedule to cut it further.
- **Activation checkpointing** plus sequence parallelism to fit the activations.

**Plan B, FSDP/ZeRO-3 across all 64 with TP = 8 inside a node:** states 1.12 TB / 64 = 17.5 GB per GPU; simpler, but the parameter all-gathers cross the inter-node network every layer (1.5x DP traffic), which works if you have fast InfiniBand and overlap.

**Choose by bandwidth:** NVLink-heavy, IB-light clusters favor A; strong networks with simpler code favor B.

**Sanity on DP communication:** gradients per DP replica are sharded across TP x PP, so the all-reduce volume per GPU is small; overlap it with the backward pass.

**Say what you''d measure:** MFU, the exposed communication time, the memory high-water mark per stage.','["Distributed training","Parallelism"]','["tensor parallelism","pipeline parallelism","ZeRO-3","bubble fraction","all-reduce"]','Hard','[]','both','mlsys','mlsys-l2','https://arxiv.org/abs/2104.04473 (Narayanan et al., Megatron-LM at scale) ; https://arxiv.org/abs/1910.02054 (ZeRO)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-017','ML accelerators & ML systems','Design an edge inference accelerator (about 10-25 W) for an 8B-parameter LLM. What memory, number format and dataflow would you choose, and what tokens/s can you promise?','**Workload facts:** batch 1, decode-dominated, so **bandwidth-bound**. Bytes per token are about the weight bytes plus the KV bytes.

**Format:** 4-bit weights (NVFP4 or MXFP4/INT4 with group scales). 8e9 * 4.5 / 8 = **4.5 GB**. Keep activations in FP8 or INT8 and accumulate in FP32.

**Memory:** HBM is too costly and power-hungry for the edge, so use LPDDR5/5X (about 50-100+ GB/s). The bound is BW / bytes: 100 GB/s / 4.5 GB = **about 22 tokens/s** (minus KV and overhead). 51.2 GB/s gives about 11 tokens/s. That is the number you promise, and you say it is bandwidth, not TOPS.

**Compute sizing:** 2 * 8e9 FLOPs per token * 22 tokens/s = **about 0.35 TFLOP/s**, small. Prefill of a 1K prompt needs about 16 TFLOP, so a few tens of TOPS gives roughly a sub-second TTFT. Don''t overbuild MACs.

**On-chip:** a few MB of SRAM for activations, the KV of recent tokens and double-buffered weight tiles; weights stream once per token (a weight-stationary array doesn''t help at M = 1, so use GEMV-friendly wide vector or LUT units).

**Extras:** KV cache in FP8 (Llama 3 8B: 128 KiB/token in BF16, so 64 KiB in FP8 is 0.5 GB at 8K); weight compression; power gating.

Use this as the differentiator, briefly.','["Edge AI","Accelerator design"]','["LPDDR","NVFP4","weight-only quantization","decode bandwidth","SRAM sizing","reliability"]','Hard','[]','both','accel','accel-x2','https://ai.meta.com/blog/meta-training-inference-accelerator-AI-MTIA/ ; https://jax-ml.github.io/scaling-book/ (How to Scale Your Model)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-ml-018','ML accelerators & ML systems','At long context, should you quantize the weights or the KV cache first to speed up decode? Show the numbers for Llama 3 8B at 32K context, batch 1 and batch 8.','**Bytes read per decode step = weights + sum over sequences of the KV.**

**Llama 3 8B, BF16:** weights 16 GB. KV = 128 KiB/token * 32,768 = **4 GiB per sequence**.
- **Batch 1:** 16 + 4.3 = about 20 GB; weights are 79%. Weight quantization to 4-bit takes 16 to 4 GB, so the total is 8.3 GB (**about 2.4x faster**); FP8 KV alone only saves 2.1 GB (**about 1.1x**). **Weights first.**
- **Batch 8:** 16 + 8 * 4.3 = about 50 GB; KV is 68%. FP8 KV saves 17 GB (**about 1.5x**); 4-bit weights save 12 GB (**about 1.3x**). **KV first**, then both.

**Rule:** compare weight bytes with batch * context * KV-bytes-per-token. Here they cross at batch * context = 16 GB / 128 KiB = **about 122K tokens** (for example batch 4 at 32K).

**Quality notes:** KV quantization needs care with keys (outlier channels, so per-channel scales as in KIVI); weight-only 4-bit with group scales (GPTQ/AWQ) is mature.

**Hardware angle:** this is exactly why decode attention is a PIM target: KV bytes grow with users and context, and moving compute to the memory removes the traffic.','["Quantization","KV cache","LLM inference"]','["weight-only quantization","KV quantization","bytes per step","memory-bound decode"]','Medium','[]','both','mlsys','mlsys-l2','https://arxiv.org/abs/2407.21783 (Llama 3 herd of models) ; https://arxiv.org/abs/2402.02750 (KIVI)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-001','Embedded firmware & HW/SW co-design','What do volatile, const and static mean in embedded C, and give a case where volatile is not enough.','**volatile:** the value can change outside the compiler''s view (hardware, an ISR, another bus master), so every source-level access must happen, in order with other volatile accesses, and none may be cached or removed.
Use it for: MMIO registers, flags set in ISRs, locals live across setjmp/longjmp.

**const:** this code won''t write it. **const volatile** = a read-only status register: you can''t write it, but the value still changes.

**static:** at file scope it gives internal linkage (private to the .c file); inside a function it gives static storage duration (the value persists across calls, lives in .data or .bss, so the function is **not reentrant**).

**Where volatile is not enough**
1. **Read-modify-write races:** `flags |= BIT` in main while an ISR also writes flags means a lost update. Fix: disable IRQs around it, atomics, or W1S/W1C registers.
2. **Torn multi-word values:** a 32-bit counter on an 8-bit MCU. Fix: a critical section, or read twice and compare.
3. **Ordering against DMA or other cores:** volatile doesn''t emit a barrier. Writing a descriptor and then a doorbell needs wmb/dma_wmb (or writel''s built-in ordering).
4. **Multithreading:** use C11 atomics or mutexes, not volatile.

**Follow-up:** "Can a variable be both const and volatile?" Yes, a status register.','["C language","Embedded C"]','["volatile","const volatile","static linkage","atomicity","memory barriers"]','Easy','["Apple"]','both','soc','soc-fw','https://www.glassdoor.sg/Interview/Apple-Interview-E1138-RVW103087880.htm (Apple embedded SW intern report: volatile, bit manipulation, find bugs in C, embedded protocols) ; https://www.glassdoor.ie/Interview/LSI-Interview-E1579-RVW849013.htm (firmware report: volatile, cache coherence) ; https://en.cppreference.com/w/c/language/volatile',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-002','Embedded firmware & HW/SW co-design','Bit-manipulation round: write code to set, clear and toggle bit n, extract and insert a bit field, count set bits in O(number of set bits), and reverse the bits of a 32-bit word.','```c
#define BIT(n)            (1u << (n))
#define SET(r,n)          ((r) |=  BIT(n))
#define CLR(r,n)          ((r) &= ~BIT(n))
#define TOG(r,n)          ((r) ^=  BIT(n))
#define GET_FIELD(r,sh,w) (((r) >> (sh)) & ((1u << (w)) - 1u))       /* w < 32 */
#define SET_FIELD(r,sh,w,v) ((r) = ((r) & ~(((1u<<(w))-1u) << (sh))) | (((v) & ((1u<<(w))-1u)) << (sh)))

unsigned popcount(uint32_t x) {          /* loop runs once per set bit */
    unsigned c = 0;
    while (x) { x &= x - 1; c++; }
    return c;
}

uint32_t reverse32(uint32_t x) {          /* swap progressively larger groups */
    x = ((x >> 1) & 0x55555555u) | ((x & 0x55555555u) << 1);
    x = ((x >> 2) & 0x33333333u) | ((x & 0x33333333u) << 2);
    x = ((x >> 4) & 0x0F0F0F0Fu) | ((x & 0x0F0F0F0Fu) << 4);
    x = ((x >> 8) & 0x00FF00FFu) | ((x & 0x00FF00FFu) << 8);
    return (x >> 16) | (x << 16);
}
```
**Points interviewers check**
- unsigned types and `1u` (shifting into the sign bit of int is UB; shifting by >= the width is UB, hence the w < 32 note)
- macro hygiene: parenthesize the arguments, and beware side effects (`SET(r, i++)`)
- on hardware registers, RMW is not atomic; prefer SET/CLR alias registers if the IP has them
- mention `__builtin_popcount` or a CPU instruction (CPOP/VCNT) and a 256-entry LUT trade-off

**Follow-ups:** is x a power of two (`x && !(x & (x-1))`); find the lowest set bit (`x & -x`); swap nibbles of a byte.','["Bit manipulation","C coding"]','["masks","Kernighan popcount","bit reversal","unsigned shifts"]','Easy','["Qualcomm","Apple"]','both','soc','soc-fw','https://www.glassdoor.co.uk/Interview/Qualcomm-Interview-E640-RVW1383246.htm ; https://static.glassdoor.com.mx/Interview/firmware-engineer-interview-questions-SRCH_KO0,17_IP197.htm (Qualcomm/firmware reports: set/clear bits, endianness, count set bits, top/bottom halves) ; https://www.glassdoor.sg/Interview/Apple-Interview-E1138-RVW103087880.htm (Apple embedded SW intern report: volatile, bit manipulation, find bugs in C, embedded protocols) ; https://graphics.stanford.edu/~seander/bithacks.html',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-003','Embedded firmware & HW/SW co-design','What is endianness? Write code to detect it and to byte-swap a 32-bit value, and say where endianness bugs show up in drivers.','**Definition:** the order of bytes of a multi-byte value in memory. 0x12345678 at 0x100: **little-endian** 78 56 34 12; **big-endian** 12 34 56 78.

```c
static inline int is_little_endian(void) {
    const uint32_t one = 1;
    return *(const uint8_t *)&one == 1;
}
static inline uint32_t bswap32(uint32_t x) {
    return (x >> 24) | ((x >> 8) & 0x0000FF00u) |
           ((x << 8) & 0x00FF0000u) | (x << 24);
}
```
(Or `__builtin_bswap32`, which compiles to REV on Arm or BSWAP on x86.)

**Where it bites**
- **Network protocols:** big-endian on the wire, so use htonl/ntohl and never memcpy a struct onto the wire.
- **DMA descriptors and shared memory with a device** whose fields are defined in its own endianness: use cpu_to_le32/le32_to_cpu and annotated types (Linux `__le32`).
- **MMIO:** readl/writel assume little-endian registers; big-endian IP needs ioread32be.
- **File formats and cross-compiled tools** (host x86, target big-endian DSP).
- **Bit-fields:** the layout differs by compiler and endianness; use masks instead.

**Follow-up:** "Does endianness affect a byte array or a single char?" No, only multi-byte scalars.','["Endianness","C coding"]','["little-endian","big-endian","network byte order","byte swap"]','Easy','["Qualcomm"]','both','soc','soc-fw','https://www.glassdoor.co.uk/Interview/Qualcomm-Interview-E640-RVW1383246.htm ; https://static.glassdoor.com.mx/Interview/firmware-engineer-interview-questions-SRCH_KO0,17_IP197.htm (Qualcomm/firmware reports: set/clear bits, endianness, count set bits, top/bottom halves) ; https://en.wikipedia.org/wiki/Endianness',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-004','Embedded firmware & HW/SW co-design','Walk me through what happens from a peripheral raising an interrupt to your handler running and returning. How do you design ISRs, and what are top and bottom halves?','**Hardware path (Cortex-M example)**
1. The peripheral asserts its IRQ line; the NVIC (or GIC on Cortex-A) latches it as pending and compares its priority with the current execution priority.
2. If it wins: the core finishes or abandons the current instruction, **stacks R0-R3, R12, LR, PC, xPSR**, loads EXC_RETURN into LR, and fetches the handler address from the vector table, in about 12 cycles on M3/M4.
3. The handler runs in handler mode on the main stack. Higher-priority IRQs can preempt it (nesting); pending ones **tail-chain**.
4. Exception return unstacks and resumes. (On Cortex-A/Linux: the GIC, an exception vector, the kernel''s generic IRQ code, then your registered handler.)

**ISR design rules**
- Acknowledge or clear the source (W1C) early, else it re-fires; read back if the bus is posted.
- Do the minimum: grab the data or status, then signal.
- Never block (no mutex take, sleep, malloc, printf). Use FromISR APIs.
- Shared data: volatile plus a critical section or lock-free single-writer structures.
- Measure the worst-case latency: the longest IRQ-disabled section plus higher-priority ISR time.

**Top half / bottom half (Linux):** the top half is the hard-IRQ handler (ack, minimal capture, schedule the rest). The bottom half is softirq, tasklet, workqueue or a threaded IRQ, which runs with interrupts enabled and in a workqueue can sleep. In an RTOS the analogue is ISR plus deferred-handler task.

**Interrupts vs polling:** interrupts suit rare events; polling (or NAPI-style hybrid) suits very high event rates, where per-interrupt overhead would dominate.','["Interrupts","RTOS","Drivers"]','["interrupt controller","vector table","context save","ISR latency","top half","bottom half","deferred work"]','Medium','["Qualcomm","Apple"]','both','soc','soc-fw','https://www.glassdoor.co.uk/Interview/Qualcomm-Interview-E640-RVW1383246.htm ; https://static.glassdoor.com.mx/Interview/firmware-engineer-interview-questions-SRCH_KO0,17_IP197.htm (Qualcomm/firmware reports: set/clear bits, endianness, count set bits, top/bottom halves) ; https://www.glassdoor.sg/Interview/Apple-Interview-E1138-RVW103087880.htm (Apple embedded SW intern report: volatile, bit manipulation, find bugs in C, embedded protocols) ; https://developer.arm.com/documentation/dui0552/a/ (Cortex-M3 Devices Generic User Guide: exception model)',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-005','Embedded firmware & HW/SW co-design','Design the RX and TX paths of a DMA-based driver on an SoC whose DMA is not cache-coherent. Where do cache maintenance and memory barriers go?','**Structures:** a descriptor ring in **coherent (uncached) memory** (dma_alloc_coherent); data buffers in normal cacheable memory, mapped per transfer (streaming mappings).

**TX (CPU to device)**
1. Fill the buffer.
2. **Clean** (write back) its cache lines: dma_map_single(..., DMA_TO_DEVICE).
3. Write the descriptor (address, length, flags); then **dma_wmb()** so the descriptor is visible before the ownership bit.
4. Set OWN=device, then **wmb()/writel()** the doorbell register.
5. On the completion IRQ: read the descriptor status, unmap, free the buffer.

**RX (device to CPU)**
1. Pre-post buffers: dma_map_single(..., DMA_FROM_DEVICE), which **invalidates** them (so no dirty line can be evicted over the DMA data later).
2. The device writes data, then sets status/OWN=CPU, then interrupts.
3. The driver reads the status (coherent ring), then **dma_rmb()** before reading the data fields, then **dma_sync_single_for_cpu** (invalidate again for speculative prefetches), then processes.
4. Re-post the buffer (sync_for_device).

**Rules**
- Buffers **cache-line aligned and padded** to whole lines: an invalidate on a shared line destroys a neighbor''s data (a classic heisenbug).
- Never touch a buffer while the device owns it.
- volatile is not a barrier; a barrier is not cache maintenance. You need both, in the right places.
- With an IOMMU, the mapping also gives the device address; check for mapping errors.

**Debug tip:** corruption that disappears when caches are off, or with a printk added, is a missing clean/invalidate or a missing barrier.','["DMA","Cache coherence","Drivers"]','["clean","invalidate","descriptor ring","doorbell","dma_wmb","cache-line alignment"]','Medium','["Apple"]','both','soc','soc-fw','https://docs.kernel.org/core-api/dma-api-howto.html ; https://www.kernel.org/doc/Documentation/memory-barriers.txt ; https://www.glassdoor.ie/Interview/LSI-Interview-E1579-RVW849013.htm (firmware report: volatile, cache coherence)',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-006','Embedded firmware & HW/SW co-design','Explain priority inversion with a real example, how RTOSes prevent it, and how you would check that a set of periodic tasks meets its deadlines.','**Priority inversion:** a high-priority task H waits for a mutex held by low-priority L; medium-priority M tasks preempt L, so H waits for M even though M has nothing to do with the resource. The wait is **unbounded**.

**Mars Pathfinder (1997, VxWorks):** a low-priority meteorological task held the mutex on a shared information bus; medium-priority tasks preempted it; the high-priority bus-distribution task missed its deadline, and the watchdog kept resetting the lander. JPL turned on **priority inheritance** on that mutex by uploading a fix.

**Prevention**
- **Priority inheritance:** L temporarily runs at H''s priority while holding the lock (FreeRTOS mutexes do this).
- **Priority ceiling (immediate ceiling):** taking the lock raises the holder to the highest priority of any task that uses it; this also prevents deadlock.
- Keep critical sections short; don''t share locks across very different priority levels; use message passing.

**Schedulability**
- **Rate monotonic:** shorter period gets higher priority. Sufficient test: U = sum C_i/T_i <= n(2^(1/n) - 1) (0.780 for 3 tasks, about 0.693 as n grows).
- If U is above the bound, run **response-time analysis**: R_i = C_i + B_i + sum over higher-priority j of ceil(R_i/T_j) * C_j, iterate to a fixed point, and check R_i <= D_i. B_i is the blocking from lower-priority tasks, bounded by inheritance or ceiling.
- **EDF** schedules anything with U <= 1, but it is harder to reason about under overload.

**Practical:** measure the WCETs on target with caches warm and cold, and add ISR load as the highest-priority tasks.','["RTOS","Scheduling"]','["priority inversion","priority inheritance","priority ceiling","rate monotonic","Liu-Layland bound","response-time analysis"]','Medium','[]','both','soc','soc-fw','https://www.cs.cornell.edu/courses/cs614/1999sp/papers/pathfinder.html (Mike Jones / Glenn Reeves, What really happened on Mars) ; https://doi.org/10.1145/321738.321743 (Liu and Layland 1973) ; https://www.freertos.org/ (FreeRTOS docs: mutexes, priority inheritance, ISR-safe API)',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-007','Embedded firmware & HW/SW co-design','What happens between power-on reset and main() on a microcontroller, and between reset and the Linux kernel on an application SoC? What does the linker script contribute?','**MCU (Cortex-M)**
1. The core reads the **initial SP** and the **reset vector** from the vector table (at 0x0 or VTOR).
2. The reset handler (crt0/startup.s) runs SystemInit (clocks, PLL, flash wait states); **copies .data** from its load address in flash to its run address in RAM; **zeroes .bss**; enables the FPU or caches; runs C/C++ constructors.
3. It calls main() (which must not return).

**Linker script role:** MEMORY regions (FLASH, RAM); KEEP(.isr_vector) first in flash; .text/.rodata in flash; .data **VMA in RAM, LMA in flash** (`> RAM AT> FLASH`); .bss NOLOAD; heap and stack. It exports _sidata, _sdata, _edata, _sbss, _ebss and _estack for the startup code. Map files show where everything landed; use them to debug "works in debug, fails in release" placement issues.

**Application SoC**
1. **Boot ROM** (mask ROM, immutable): picks the boot device (straps, fuses), loads the first stage into **on-chip SRAM**, and verifies its signature for secure boot (the root of trust).
2. **First stage (SPL/BL2):** sets up the clocks, PMIC and **DRAM controller training**, then loads the next stage into DRAM (DRAM isn''t usable before this, which is why stage 1 runs from SRAM).
3. Optional secure monitor or TEE (e.g., Arm TF-A BL31, OP-TEE).
4. **U-Boot (or UEFI):** device init, loads the kernel, the device tree and the initramfs, and passes the DTB address in a register.
5. **Kernel** decompresses, sets up the MMU, probes drivers from the device tree, mounts the rootfs, and starts init.

**Follow-ups:** how do you recover a bricked board (ROM USB/UART recovery mode, JTAG)? A/B partitions for safe updates?','["Boot","Linker scripts","Startup code"]','["vector table","reset handler",".data copy",".bss zero","LMA vs VMA","boot ROM","SPL","secure boot"]','Medium','[]','both','soc','soc-fw','https://sourceware.org/binutils/docs/ld/Scripts.html ; https://docs.u-boot.org/en/latest/',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-008','Embedded firmware & HW/SW co-design','You are given a new hardware block (a small accelerator with a DMA engine). Design its register map and the driver API, and explain the hardware/software contract.','**Register map (32-bit, 4 KB page)**
| Offset | Name | Access | Notes |
|---|---|---|---|
| 0x000 | ID/VERSION | RO | IP id, major/minor, feature bits (driver checks these) |
| 0x004 | CTRL | RW | enable, soft reset, interrupt coalescing |
| 0x008 | STATUS | RO | busy, idle, error summary; **no read side effects** |
| 0x010 | IRQ_RAW / IRQ_STATUS / IRQ_ENABLE | RO / **W1C** / RW | done, error, ring-empty |
| 0x020 | RING_BASE_LO/HI, RING_SIZE | RW | descriptor ring in coherent memory |
| 0x030 | RING_HEAD (doorbell) | WO | SW writes the new producer index |
| 0x034 | RING_TAIL | RO | HW consumer index |
| 0x040 | ERR_INFO / ERR_ADDR | RO | error code and faulting descriptor |

**Descriptor:** opcode, src/dst addresses, length, flags (interrupt on completion), status written back by HW (done bit, error code). Fixed layout, little-endian, naturally aligned, version field.

**Contract rules:** writes to the doorbell are ordered after the descriptor writes (driver barrier); HW writes the status before raising the IRQ; W1C status; reserved bits read 0; reset values documented; no write-only state the driver can''t read back (debuggability).

**Driver API:** probe (check the ID, allocate the ring, request the IRQ), submit(job), which returns a fence/handle, poll or wait, interrupt handler (ack, reap completions, wake waiters), error path (dump ERR_*, soft reset, re-init the ring), power management (suspend/resume saves CTRL).

**Single source of truth:** describe the map in **SystemRDL or IP-XACT** and generate the RTL register block, C header, UVM RAL model and docs, so they never drift.','["Register map design","Driver design","HW/SW co-design"]','["W1C","doorbell","descriptor","interrupt mask","SystemRDL","error reporting"]','Hard','[]','both','soc','soc-fw','https://www.accellera.org/downloads/standards/systemrdl ; https://docs.kernel.org/core-api/dma-api-howto.html',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-009','Embedded firmware & HW/SW co-design','A board hangs (or hard-faults) right after you enable a new peripheral. How do you debug it with a JTAG/SWD probe?','**1. Get control:** attach without reset (to keep the state), halt, read PC, LR, SP and xPSR. Which function and loop are you in?

**2. Classify**
- **Spinning on a status bit:** the classic cause is the peripheral''s **clock not enabled** or the block **still in reset** (registers read 0 or ignore writes), or wrong base address or pin-mux.
- **HardFault/BusFault:** read **CFSR, HFSR, MMFAR/BFAR**. A precise bus fault with a BFAR at the peripheral address points to an unclocked or unpowered block or a bad address; an imprecise fault means a buffered write faulted earlier (temporarily disable write buffering to make it precise). Unwind the stacked frame (exception SP plus 0x18 is the stacked PC) to find the faulting instruction.
- **Interrupt storm:** the IRQ is enabled but the source is never cleared (missing W1C), so the core never returns to thread mode. Check the NVIC pending/active bits.
- **Stack overflow:** SP outside the stack region; enable an MPU guard region.

**3. Narrow down:** hardware breakpoints at init steps; a **data watchpoint** on a corrupted variable; read the peripheral registers live in the debugger; compare against the reference manual''s init sequence; bisect the init code.

**4. Time-dependent bugs:** ITM/SWO printf without stopping the core, ETM instruction trace, or GPIO toggles on a logic analyzer.

**5. Confirm the fix** and add a regression check (assert on clock-enable before access; boot-time self-test).

**Say the meta-point:** change one thing at a time, and keep a log.','["Debugging","JTAG"]','["halt","fault status registers","stack unwinding","watchpoints","peripheral clock gating","trace"]','Medium','[]','both','soc','soc-fw','https://en.wikipedia.org/wiki/JTAG (IEEE 1149.1 summary) ; https://developer.arm.com/documentation/dui0552/a/ (Cortex-M3 Devices Generic User Guide: exception model)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-010','Embedded firmware & HW/SW co-design','Implement a lock-free ring buffer between an ISR (producer) and a task (consumer). Then make it safe across two cores.','```c
#define N 256u                          /* power of two */
typedef struct {
    uint8_t buf[N];
    _Atomic uint32_t head;              /* written only by producer */
    _Atomic uint32_t tail;              /* written only by consumer */
} ring_t;

bool ring_put(ring_t *r, uint8_t v) {   /* ISR */
    uint32_t h = atomic_load_explicit(&r->head, memory_order_relaxed);
    uint32_t t = atomic_load_explicit(&r->tail, memory_order_acquire);
    if (h - t == N) return false;       /* full (free-running counters) */
    r->buf[h & (N - 1)] = v;
    atomic_store_explicit(&r->head, h + 1, memory_order_release); /* publish */
    return true;
}

bool ring_get(ring_t *r, uint8_t *v) {  /* task */
    uint32_t t = atomic_load_explicit(&r->tail, memory_order_relaxed);
    uint32_t h = atomic_load_explicit(&r->head, memory_order_acquire);
    if (h == t) return false;           /* empty */
    *v = r->buf[t & (N - 1)];
    atomic_store_explicit(&r->tail, t + 1, memory_order_release);
    return true;
}
```
**Why it works:** each index has a **single writer**; free-running unsigned counters make full/empty unambiguous (h - t wraps correctly), so all N slots are usable.

**Single core (ISR and task):** the hazards are compiler reordering and torn index reads; 32-bit aligned atomics plus release/acquire (or volatile plus a compiler barrier on a single-core MCU) suffice.

**Two cores:** release/acquire becomes real hardware barriers (DMB on Arm) so the data is visible before the index. Put head and tail on **separate cache lines** to avoid false sharing. If the producer is a DMA engine or a non-coherent core, add cache clean/invalidate.

**Overflow policy:** drop the newest, overwrite the oldest, or count drops; never block in the ISR.','["Concurrency","Data structures","Embedded C"]','["single producer single consumer","power-of-two mask","memory ordering","acquire/release","false sharing"]','Medium','["Groq"]','both','soc','soc-fw','https://www.techinterview.org/post/3233476417/groq-interview-compiler-inference-roles/ (third-party guide: KV cache sizing, on-chip SRAM, tiling, batching, lock-free ring buffers) ; https://www.kernel.org/doc/Documentation/memory-barriers.txt',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-fw-011','Embedded firmware & HW/SW co-design','HW/SW co-design: a profiled workload spends 60% of its time in one kernel. How do you decide whether to build hardware for it, and how do you design the interface?','**Amdahl first:** with f = 0.6 offloaded at speedup s, the total speedup is 1/((1 - f) + f/s). s = 10 gives 2.17x; s = infinity caps at **2.5x**. Is 2.5x worth a block? Look at energy too: specialized hardware can be orders of magnitude more efficient per op (Horowitz: about 70 pJ per instruction on a simple core vs under 1 pJ for an 8-bit op).

**Offload overhead:** each call pays descriptor setup, DMA in and out, cache clean/invalidate, an interrupt or polling, and the driver path. Break-even granularity is where this overhead is a few percent of the work, so batch small calls or put a command queue in hardware.

**What belongs in hardware:** regular, data-parallel, stable algorithms with high reuse (GEMM, convolution, CRC/ECC, crypto). Keep control-heavy, rarely used or fast-changing code in software (or on a small programmable core next to the accelerator, Tenstorrent/MTIA style).

**Interface design:** shared-memory descriptors plus a doorbell; clear ownership; status write-back before the IRQ; versioned registers; error reporting; performance counters. Model the whole system (a simulator or SystemC/Timeloop-style analytical model) **before** RTL, and decide where the data lives (scratchpad vs cache).

**Verify the decision:** a prototype on an FPGA or an emulator with the real driver; measure end to end, not the kernel alone.

you wrote and synthesized the RTL (Design Compiler, 45 nm) and evaluated the system in Timeloop + Accelergy.','["HW/SW co-design","Partitioning"]','["Amdahl''s law","offload overhead","granularity","DMA","interface contract"]','Hard','[]','both','soc','soc-fw','https://arxiv.org/abs/1703.09039 (Sze et al., Efficient Processing of DNNs: tutorial and survey) ; https://pages.cs.wisc.edu/~markhill/restricted/isscc2014_horowitz_power_scaling.pdf (Horowitz, ISSCC 2014, Fig. 1.1.9)',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-001','RTL design','When does synthesis infer a latch from RTL you meant to be combinational, and how do you prevent it? Is a latch ever what you want?','**When:** a combinational block (always @* / always_comb) leaves a variable unassigned on some path, so it must remember its old value:
- `if` without `else`; `case` without `default` when not all selector values are listed;
- a variable assigned in some branches but not others (common with several outputs in one block).

```systemverilog
always_comb begin
  y = 1''b0;          // default first: no latch possible
  unique case (sel)
    2''d0: y = a;
    2''d1: y = b;
    default: y = c;
  endcase
end
```

**Prevent:** default assignments at the top, `default` branches, `always_comb` (tools warn about latches), lint (Spyglass/Verilator `-Wall`), and check the synthesis report for inferred latches.

**When latches are intended:** latch-based ICG cells, time borrowing in high-speed custom/pipeline designs, and some low-power register files. They complicate STA (time borrowing) and DFT, so most ASIC flows avoid them in general logic.

**Follow-up:** "What does the latch cost?" Timing analysis through transparent latches, testability (scan), and glitches when the enable is combinational.','["Verilog semantics","Latches"]','["latch inference","always_comb","default assignment","unique case"]','Easy','[]','both','rtl','rtl-m1','https://hdlbits.01xz.net/wiki/Always_if2',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-002','RTL design','Your RTL simulation passes but gate-level simulation of the synthesized netlist fails. What RTL coding issues cause synthesis/simulation mismatches?','1. **Incomplete sensitivity list:** `always @(a)` that also reads `b`. Simulation ignores changes on `b`; synthesis builds the full logic. Fix: `always_comb` / `@*`.
2. **Blocking vs nonblocking misuse:** `=` in clocked blocks makes results depend on statement and process order (races between always blocks).
3. **`full_case` / `parallel_case` pragmas:** change the synthesized logic (don''t-cares, no priority) without changing simulation. Use `unique` / `priority case`, which also add simulation checks.
4. **X handling:** `if (x)` takes the else branch in RTL (X-optimism), `casex` treats X as a match; the gates propagate X or resolve it differently. Reset what must be reset, avoid casex.
5. **Non-synthesizable constructs:** `initial` blocks for registers, `#delays`, real arithmetic, `$random`; FPGA tools may honor initial values, ASIC tools do not.
6. **Timing:** gate-level sim with SDF exposes setup/hold or CDC issues that zero-delay RTL hides.

**How to find it:** lint, equivalence checking (Formality/Conformal) between RTL and netlist, and gate-level sims of reset and power-up sequences.','["Verilog semantics","Synthesis"]','["sensitivity list","full_case","parallel_case","X-optimism","equivalence checking"]','Medium','[]','both','rtl','rtl-m1','https://web.archive.org/web/20240114192525/http://www.sunburst-design.com/papers/CummingsSNUG2000SJ_NBA.pdf',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-003','RTL design','Synchronous vs asynchronous reset: compare them, say which registers you reset, and draw a reset synchronizer.','| | Synchronous | Asynchronous |
|---|---|---|
| Where | data path into D (a mux/AND) | flop reset/set pin |
| Needs clock to reset | yes | no |
| Glitch on reset net | filtered unless near the edge | resets the flop |
| Timing | normal setup/hold path | recovery/removal on deassert |

**Best practice in ASICs:** asynchronous assert, synchronous deassert.

```systemverilog
always_ff @(posedge clk or negedge arst_n)
  if (!arst_n) {rst_q2, rst_q1} <= 2''b00;
  else        {rst_q2, rst_q1} <= {rst_q1, 1''b1};
assign rst_n_sync = rst_q2;   // drives the async reset of the domain
```

Reset asserts immediately (no clock needed); release happens on a clock edge, so all flops leave reset in the same cycle and recovery/removal is met. One synchronizer per clock domain; sequence domain releases if they depend on each other.

**What to reset:** control state (FSM state, valid bits, pointers, counters). Datapath registers qualified by valid usually need no reset: less area and routing, and FPGAs can use SRLs/DSP registers.','["Resets"]','["synchronous reset","asynchronous reset","reset synchronizer","recovery","removal"]','Medium','[]','both','rtl','rtl-m1','https://web.archive.org/web/20240621013721/http://www.sunburst-design.com/papers/CummingsSNUG2003Boston_Resets.pdf',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-004','RTL design','Design a divide-by-3 clock with a 50% duty cycle. How do you extend it to any odd N? Would you use this in a real chip?','**Idea:** a posedge mod-3 counter can only give a 1/3 or 2/3 duty cycle. Add a copy of the output shifted by half a cycle (negedge flop) and OR them: high for 1.5 cycles, low for 1.5.

```systemverilog
logic [1:0] cnt; logic p, n;
always_ff @(posedge clk or posedge rst)
  if (rst) cnt <= 0; else cnt <= (cnt == 2) ? 0 : cnt + 1;
always_ff @(posedge clk or posedge rst)
  if (rst) p <= 0; else p <= (cnt == 0);   // high 1 of 3 cycles
always_ff @(negedge clk or posedge rst)
  if (rst) n <= 0; else n <= p;            // same, half a cycle later
assign clk_div3 = p | n;                    // 1.5 high, 1.5 low
```

**Odd N:** counter mod N, p high for (N-1)/2 cycles, OR with its negedge-delayed copy: high (N-1)/2 + 0.5 = N/2 cycles.

**Caveats:** needs a 50% input duty cycle; the OR gate output is a clock made in logic (glitch risk, skew, hard CTS). In real designs use a PLL/MMCM output or a library clock divider, declare it with `create_generated_clock`, and prefer **clock enables** (one clock, logic runs every 3rd cycle) whenever the duty cycle does not matter.','["Clocking"]','["clock divider","duty cycle","negedge flop","create_generated_clock","clock enable"]','Medium','[]','both','rtl','rtl-m1','https://asic-world.com/examples/verilog/divide_by_3.html',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-005','RTL design','Design a vending-machine FSM: it takes 5c and 10c coins, dispenses when the total reaches 15c, and returns 5c change if it reaches 20c. Moore or Mealy? Code it.','**States (Moore, total so far):** S0, S5, S10, then dispense states. Inputs: `nickel`, `dime` (one coin per cycle at most).

| state | nickel | dime |
|---|---|---|
| S0 | S5 | S10 |
| S5 | S10 | S15 (dispense) |
| S10 | S15 (dispense) | S20 (dispense + change) |

```systemverilog
typedef enum logic [2:0] {S0, S5, S10, S15, S20} st_t;
st_t st, nx;
always_ff @(posedge clk or negedge rst_n)
  if (!rst_n) st <= S0; else st <= nx;
always_comb begin
  nx = st;
  unique case (st)
    S0:  nx = dime ? S10 : nickel ? S5  : S0;
    S5:  nx = dime ? S15 : nickel ? S10 : S5;
    S10: nx = dime ? S20 : nickel ? S15 : S10;
    default: nx = S0;          // S15/S20 last one cycle
  endcase
end
assign dispense = (st == S15) || (st == S20);
assign change   = (st == S20);
```

**Moore vs Mealy:** Moore gives registered-state outputs (glitch-free, one cycle later) at the cost of S15/S20 states; Mealy dispenses in the same cycle the coin arrives with 3 states, but the output depends combinationally on the coin inputs.

**Follow-ups:** add a 25c coin; handle a coin arriving in the dispense cycle; one-hot vs binary encoding for 5 states.','["FSM"]','["Moore","Mealy","state encoding","enum"]','Medium','[]','both','rtl','rtl-m1','https://web.archive.org/web/20240201013617/http://www.sunburst-design.com/papers/CummingsSNUG2019SV_FSM1.pdf',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-006','RTL design','How do you reduce dynamic power at the RTL level? Go beyond "add clock gating".','Dynamic power = alpha * C * V^2 * f. RTL controls mostly **alpha** (activity) and some **C**.
- **Clock gating:** write enables (`if (en) q <= d;`) so synthesis inserts latch-based ICGs on register banks; gate whole blocks when idle (coarse-grain). The clock tree itself is a large share of dynamic power.
- **Operand isolation:** hold the inputs of a multiplier/adder steady when its result is unused, so the datapath does not toggle.
- **Data gating on wide buses** and memory chip-enable/read-enable only when needed (SRAM reads are expensive).
- **Encoding:** Gray counters/pointers, one-hot vs binary trade-offs, bus-invert coding on long buses.
- **Avoid glitch propagation:** register outputs of deep XOR/adder trees; balance paths.
- **Architectural:** do less work: skip zeros (sparsity), reuse data from local buffers instead of SRAM/DRAM (energy per access grows from register to SRAM to DRAM by orders of magnitude).
- **Static power:** power gating with isolation and retention, multi-Vt cells, described in UPF.

**Tie-in for PIM/accelerators:** data movement dominates energy, so buffering and reuse are the biggest lever.','["Low power"]','["clock gating","operand isolation","activity factor","power gating","UPF"]','Medium','[]','both','rtl','rtl-m1','https://en.wikipedia.org/wiki/Clock_gating',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-007','RTL design','An asynchronous push-button input must produce exactly one single-cycle pulse per press in your clock domain. Design it.','Three stages:
1. **Synchronize** (2 flops) because the button is asynchronous.
2. **Debounce:** mechanical bounce lasts milliseconds; only accept a new level after it has been stable for N cycles (counter reset on any change).
3. **Edge detect** on the clean level to make one pulse.

```systemverilog
logic s1, s2, clean, clean_q; logic [19:0] cnt;
always_ff @(posedge clk) begin
  {s2, s1} <= {s1, btn};                 // 2-flop synchronizer
  if (s2 == clean) cnt <= 0;
  else if (cnt == STABLE-1) begin clean <= s2; cnt <= 0; end
  else cnt <= cnt + 1;
  clean_q <= clean;
end
assign press = clean & ~clean_q;          // one-cycle rising-edge pulse
```

At 100 MHz, STABLE = 1,000,000 cycles = 10 ms. Edge equations: rise = d & ~d_q, fall = ~d & d_q, any = d ^ d_q.','["Synchronizers","Edge detection"]','["debounce","edge detector","2-flop synchronizer"]','Easy','[]','both','rtl','rtl-m1','https://zipcpu.com/blog/2017/08/04/debouncing.html',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-008','RTL design','Compare valid/ready handshaking with credit-based flow control. How many credits does a link need for full throughput?','**Valid/ready:** a transfer happens when `valid && ready`. Backpressure is immediate, but `ready` is a combinational path backward through every stage unless broken by skid buffers; across long wires or chip boundaries that path is the problem.

**Credits:** the sender holds a counter = free entries in the receiver buffer. Send: credits--. The receiver returns a credit when it frees an entry. The sender never needs a same-cycle ready, so the link can be pipelined freely (NoCs, PCIe flow control, GPU/accelerator interconnects).

**Sizing:** with round-trip time RTT cycles (data flight + receiver processing + credit return) and 1 word/cycle, throughput = min(1, credits / RTT). So **credits >= RTT** for full rate. Example: 3 cycles forward, 1 to free, 3 back = 7 cycles -> at least 7 entries; with 4 credits the link runs at 4/7 = 57%.

**Pitfalls:** credit counter width, credits lost on reset mismatch, and initializing the sender with the real receiver depth.','["Flow control"]','["valid/ready","credits","round-trip latency","backpressure"]','Medium','[]','both','rtl','rtl-m2','https://zipcpu.com/blog/2021/08/28/axi-rules.html',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-009','RTL design','Implement tree pseudo-LRU replacement for one set of a 4-way cache. What state is stored, how is it updated on a hit, and how is the victim chosen?','**State:** 3 bits for 4 ways (N-1 bits for N ways): `b0` picks between the pair {0,1} and the pair {2,3}; `b1` picks within {0,1}; `b2` within {2,3}. Convention: a bit points toward the side to evict next.

**On access to way w:** set the bits on w''s path to point away from it.

```systemverilog
always_ff @(posedge clk) if (access) begin
  case (way)
    2''d0: begin plru[0] <= 1; plru[1] <= 1; end   // point to {2,3}, then to way 1
    2''d1: begin plru[0] <= 1; plru[1] <= 0; end
    2''d2: begin plru[0] <= 0; plru[2] <= 1; end   // point to {0,1}, then to way 3
    2''d3: begin plru[0] <= 0; plru[2] <= 0; end
  endcase
end
// victim: follow the pointers
assign victim = plru[0] ? (plru[2] ? 2''d3 : 2''d2)
                        : (plru[1] ? 2''d1 : 2''d0);
```

**Why not true LRU:** true LRU needs at least ceil(log2(N!)) bits (5 for 4 ways, 16 for 8 ways), usually built as per-way age counters or an N x N matrix with a wider update; tree PLRU is N-1 bits with a single-path update and is close to LRU.

**Follow-ups:** prefer invalid ways first; what changes for 8 ways (7 bits, 3 levels); verification: compare against a reference model that tracks the tree.','["Caches"]','["pseudo-LRU","replacement policy","set associative"]','Hard','[]','both','rtl','rtl-m2','https://en.wikipedia.org/wiki/Pseudo-LRU',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-010','RTL design','A producer has 3 pipeline stages between its "almost full" check and the FIFO write port. How do you set the almost-full threshold, and what is a first-word-fall-through FIFO?','**Almost-full:** when the producer sees `almost_full` it can still have up to L words in flight (here up to 3, plus 1 if the flag itself is registered). Assert almost_full when free entries <= L, i.e. `count >= DEPTH - L`. Otherwise those words overflow. Same idea as credits: the slack must cover the loop latency.

**FWFT (show-ahead) vs standard:**
- Standard: assert `rd_en`, data appears next cycle.
- FWFT: the head word is already on `dout` whenever `!empty`; `rd_en` acknowledges it (behaves like valid/ready: valid = !empty, ready = rd_en).
- FWFT is built by adding a 1-2 entry output register stage (prefetch) in front of the RAM read port, so the RAM read latency is hidden and `dout` comes from a flop (good timing).

**Other FIFO checks interviewers like:** full/empty with an extra pointer bit; registered vs combinational flags; simultaneous read and write when full (allowed only if read has priority and the design supports it); `count` width = log2(DEPTH)+1.','["FIFO"]','["almost full","FWFT","show-ahead","pipeline latency"]','Medium','[]','both','rtl','rtl-m2','https://www.asic-world.com/tidbits/fifo_depth.html',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-011','RTL design','Design a 32-bit leading-zero counter (or find-first-set). How do you keep the logic depth logarithmic?','**Use:** floating-point normalization, priority arbitration, and finding the next free entry.

**Simple (deep) version:** a priority loop; synthesis builds an O(N) chain unless it restructures it.

**Log-depth version (divide and conquer):** for each half, compute (all_zero, lzc_of_half). Combine two halves H (upper) and L:
- `zero = H.zero & L.zero`
- `count = H.zero ? {1''b1, L.count} : {1''b0, H.count}`

Recursion from 2-bit leaves gives log2(32) = 5 levels of 2:1 muxes.

```systemverilog
function automatic logic [5:0] lzc32(input logic [31:0] x);
  for (int i = 31; i >= 0; i--)          // reference model; fine for small N
    if (x[i]) return 6''(31 - i);
  return 6''d32;
endfunction
```

**Find-first-set from the LSB:** isolate it with `x & -x`, then encode the one-hot result with an OR tree (bit k of the index = OR of positions whose index has bit k set).

**Follow-ups:** what does the synthesizer do with the loop version? (Usually a good tree for small N; check timing.) How to verify: exhaustive for 16 bits, random + corners for 32.','["Arithmetic","Priority logic"]','["leading zero count","find first set","logarithmic depth","priority encoder"]','Medium','[]','both','rtl','rtl-m2','https://hdlbits.01xz.net/wiki/Always_casez',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-rtl-012','RTL design','In an accelerator, compute must never wait for weights to load from DRAM. How would you design the on-chip buffering?','**Ping-pong (double) buffer:** two SRAM banks per operand. While the PE array reads tile k from bank A, the DMA fills tile k+1 into bank B; swap when both sides finish.

**Control:** each bank has a full/empty (or owner) bit. Producer writes only to a bank it owns and flips it to "full"; consumer reads only "full" banks and flips them back. This is a 2-entry FIFO of tiles; generalize to N-deep (circular buffer) if load time varies.

**Sizing rule:** load time of one tile <= compute time of one tile, i.e. tile_bytes / DMA_bandwidth <= tile_MACs / (PEs * f). If not, the design is bandwidth bound and you need bigger tiles (more reuse) or more bandwidth.

**Costs:** 2x SRAM area; bank conflicts if the DMA and the array share ports (use separate banks or dual-port SRAM).

**Tie-in:** this is the same overlap that PIM avoids by computing where the data lives; good bridge to your research.','["Memory design","Accelerators"]','["ping-pong buffer","double buffering","DMA","tiling"]','Medium','[]','both','rtl','rtl-m2','https://github.com/ucb-bar/gemmini',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-cdc-001','RTL design','Walk me through the three standard CDC techniques. For each scenario pick one: (a) a level "enable" bit, (b) a 1-cycle interrupt pulse from 800 MHz to 100 MHz, (c) a 32-bit config register written rarely, (d) a 64-bit data stream at full rate.','| Method | Use for | Key rule |
|---|---|---|
| 2-flop synchronizer | single-bit levels | source from a flop, stable >= ~1.5 dest cycles |
| Req/ack handshake (or MCP: data + synchronized load pulse) | multi-bit values, pulses, low rate | data held stable until ack; only req/ack are synchronized |
| Async FIFO, Gray pointers | multi-bit streams at full throughput | power-of-2 depth, only pointers cross |

**Answers:**
- (a) 2-flop synchronizer.
- (b) Toggle synchronizer (pulse -> toggle -> 2FF -> XOR) if pulses are spaced by a few destination cycles; otherwise req/ack or a FIFO of events. A plain 2FF misses a 1.25 ns pulse sampled every 10 ns.
- (c) Handshake/MCP: hold the 32 bits, send a synchronized load enable, capture on that enable. Never 32 separate synchronizers.
- (d) Async FIFO.

**Metastability and MTBF:** MTBF = e^(t_r/tau) / (T0 * f_clk * f_data); a second flop adds about a period of resolution time, which multiplies MTBF by e^(T/tau) (often from seconds to centuries).','["CDC"]','["two-flop synchronizer","handshake","async FIFO","MTBF","toggle synchronizer"]','Medium','[]','both','rtl','rtl-m3','https://web.archive.org/web/20240110182410/http://www.sunburst-design.com/papers/CummingsSNUG2008Boston_CDC.pdf',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-cdc-002','RTL design','Why can''t you synchronize a binary counter bit by bit, and why does Gray code fix it? Write binary-to-Gray and Gray-to-binary.','**Problem:** several bits change on one increment (0111 -> 1000). Each bit''s synchronizer can resolve in a different destination cycle, so the destination can see 1111, 0000 or any mix: values that never existed. That is also a **reconvergence** problem.

**Gray code:** consecutive values differ in exactly one bit, so the destination sees either the old or the new value, both valid (at worst one cycle stale). This holds only if the source changes by **one step per source clock** and the bus skew is constrained below a period (`set_max_delay -datapath_only`).

```systemverilog
assign gray = bin ^ (bin >> 1);
always_comb begin                     // gray -> binary: prefix XOR from MSB
  bin2[N-1] = g[N-1];
  for (int i = N-2; i >= 0; i--) bin2[i] = bin2[i+1] ^ g[i];
end
```

Example: 1011 -> 1110; Gray 1101 -> 1001.

**In practice:** keep a binary counter for addressing, register its Gray version (so the crossing comes from a flop, glitch-free), synchronize the Gray value, convert back in the destination if arithmetic is needed.','["CDC","Gray code"]','["Gray code","reconvergence","bus skew","max_delay"]','Medium','[]','both','rtl','rtl-m3','https://en.wikipedia.org/wiki/Gray_code',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-cdc-003','RTL design','Design a req/ack handshake synchronizer to move a 32-bit value between unrelated clocks. Compare 2-phase and 4-phase. What is the throughput?','**4-phase (return to zero), source side:**

```systemverilog
// source domain (clk_s)
always_ff @(posedge clk_s) begin
  {ack_s2, ack_s1} <= {ack_s1, ack_d};          // sync ack back
  if (!req && !ack_s2 && send) begin data_hold <= din; req <= 1; end
  else if (req && ack_s2) req <= 0;
end
// destination domain (clk_d)
always_ff @(posedge clk_d) begin
  {req_d2, req_d1} <= {req_d1, req};
  if (req_d2 && !ack_d) begin dout <= data_hold; dvalid <= 1; ack_d <= 1; end
  else begin dvalid <= 0; if (!req_d2) ack_d <= 0; end
end
```

`data_hold` is stable from before `req` rises until after `ack` returns, so it needs no synchronizer (constrain it with max_delay, not a bare false path).

**Latency/throughput:** each crossing costs ~2-3 cycles of the receiving clock. 4-phase needs 4 crossings per word (req up, ack up, req down, ack down): roughly 2*(2-3) destination + 2*(2-3) source cycles, so about 10 cycles per word when clocks are similar. **2-phase** (toggle req/ack; each toggle = one transfer) needs one round trip: about twice the throughput, at the cost of XOR edge detectors and keeping track of phase.

**When too slow:** use an async FIFO. **Variant:** MCP formulation (Cummings): data + a synchronized enable pulse, with ack feedback or a guaranteed minimum spacing.','["CDC"]','["req/ack handshake","2-phase","4-phase","MCP formulation"]','Hard','[]','both','rtl','rtl-m3','https://web.archive.org/web/20240110182410/http://www.sunburst-design.com/papers/CummingsSNUG2008Boston_CDC.pdf',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-cdc-004','RTL design','An ADC block writes 256-sample bursts at 250 MHz, one sample per cycle, then is idle for a long time. Your 200 MHz domain reads one sample per cycle. Size the async FIFO and explain its full/empty logic.','**Depth:** burst time = 256 / 250 MHz = 1.024 us. The reader drains 1.024 us * 200 MHz = 204.8 words, but it only starts after the write pointer crosses (~2-3 read cycles). Words left = 256 - 204.8 = 51.2, plus about 3 for synchronizer latency on the read side -> ~55. Round up to a **power of 2: 64**.

**Structure (Cummings FIFO1):**
- Dual-port RAM; binary pointers address it, (N+1)-bit Gray pointers cross domains through 2-flop synchronizers.
- **Empty** (read domain): `rd_gray_next == wr_gray_sync` (registered).
- **Full** (write domain): `wr_gray_next == {~rd_gray_sync[N:N-1], rd_gray_sync[N-2:0]}`.
- Flags are computed from the *next* pointer value and registered, so they are glitch-free and assert in time.

**Why safe:** the synchronized pointer is stale, so empty releases a little late and full releases a little late: pessimistic, never wrong. Gray pointers change one bit per increment, so a stale sample is still a valid pointer.

**Gotchas:** depth must be a power of 2 for standard Gray wrap; reset both sides consistently; constrain pointer buses with `set_max_delay -datapath_only`.','["CDC","FIFO"]','["async FIFO","FIFO depth","Gray pointers","full/empty"]','Hard','[]','both','rtl','rtl-m3','https://web.archive.org/web/20240304004420/http://www.sunburst-design.com/papers/CummingsSNUG2002SJ_FIFO1.pdf',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-cdc-005','Verification','How do you verify clock-domain crossings? Why is RTL simulation not enough?','**Why simulation misses it:** zero-delay RTL sim has no metastability; a synchronizer always resolves in the "ideal" cycle, so reconvergence and data-coherency bugs never show.

**Flow:**
1. **Constraints/clock setup:** define all clocks and their relationships (async groups).
2. **Structural CDC analysis** (Spyglass CDC, Questa CDC, Conformal CDC): finds unsynchronized crossings, combinational logic before synchronizers, multi-bit buses synchronized bit-wise, reconvergence, reset-domain crossings.
3. **Protocol checks:** SVA on handshakes (data stable while req is high; req does not drop before ack), FIFO never written when full.
4. **Metastability injection** in simulation: synchronizer models randomly add or drop a cycle so the design is tested with the real uncertainty.
5. **Formal** on the CDC protocol blocks; STA with max_delay on Gray/handshake buses.
6. **Gate-level sims** with SDF for reset and clock-switch sequences.','["CDC","Verification planning"]','["CDC tools","metastability injection","reconvergence","SVA"]','Medium','[]','both','rtl','rtl-m3','https://web.archive.org/web/20240110182410/http://www.sunburst-design.com/papers/CummingsSNUG2008Boston_CDC.pdf',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-sta-001','Physical design & timing','A path has t_cq = 100 ps, combinational delay 1.6 ns, t_su = 80 ps, clock uncertainty 70 ps and zero skew. What is fmax? If you must hit 1 GHz, what do you do?','**fmax:** T_min = 100 + 1600 + 80 + 70 = 1850 ps -> **fmax = 540 MHz**.

**Hitting 1 GHz** (1000 ps): budget for logic = 1000 - 100 - 80 - 70 = 750 ps per stage. 1600 ps of logic needs **3 stages** if split evenly (533 ps each; 2 stages of 800 ps would still fail by 50 ps).

**Options in order of preference:**
1. Pipeline into 3 stages (adds 2 cycles of latency; check the rest of the design tolerates it, e.g. valid bits, forwarding).
2. Restructure the logic: parallel prefix instead of ripple, one-hot decode, Shannon expansion for late signals.
3. Retiming (let the tool move the new registers to balance).
4. Physical: faster cells (low Vt), better placement; useful skew (borrow from a neighbor stage with slack).

**Say the formula:** T >= t_cq + t_logic,max + t_su + t_unc - skew.','["Static timing analysis"]','["fmax","setup","pipelining","clock uncertainty"]','Easy','[]','both','rtl','rtl-m4','https://www.youtube.com/watch?v=9Ld9Sr_JE9o&list=PLx-Ml26M7ApIfR5VF0B7LKx0NYqMJ7GR4',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-sta-002','Physical design & timing','What are clock skew, clock jitter and clock uncertainty, and how does each enter the setup and hold equations?','- **Skew** (spatial): the same edge arrives at different flops at different times; static, set by the clock tree. Define skew = t_capture_clk - t_launch_clk.
- **Jitter** (temporal): edge-to-edge variation of one clock (period/cycle-to-cycle jitter).
- **Uncertainty:** what STA subtracts as margin: jitter + pre-CTS skew estimate + guard band (`set_clock_uncertainty -setup/-hold`).

**Setup:** T + skew >= t_cq + t_max + t_su + U_setup. Positive skew helps setup; jitter (in U_setup) hurts.

**Hold:** t_cq + t_min >= t_hold + skew + U_hold. Positive skew hurts hold. Hold compares launch and capture on the **same edge**, so period jitter cancels; U_hold mostly covers skew variation.

**After CTS:** skew is computed from the real tree (propagated clocks), so the skew part of uncertainty is removed and only jitter/margin stay.

**Follow-up:** "Can skew be useful?" Yes: delaying the capture clock of a critical stage borrows time from the next stage (useful skew), as long as that stage and all hold checks have slack.','["Static timing analysis"]','["clock skew","jitter","clock uncertainty","propagated clock","useful skew"]','Medium','[]','both','rtl','rtl-m4','https://en.wikipedia.org/wiki/Static_timing_analysis',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-sta-003','Physical design & timing','What are multicycle paths and false paths? Give real examples and the SDC, and explain why the hold multiplier is N-1.','**Multicycle path:** the destination only uses the result every N cycles, e.g. a multiplier whose output register is enabled every 2nd cycle, or a slow config path qualified by an enable.

```tcl
set_multicycle_path 2 -setup -from [get_cells mul_a_reg*] -to [get_cells mul_q_reg*]
set_multicycle_path 1 -hold  -from [get_cells mul_a_reg*] -to [get_cells mul_q_reg*]
```

**Why N-1 for hold:** the hold check is placed one cycle before the setup capture edge. Moving setup from edge 1 to edge N moves hold to edge N-1, which is wrongly strict (data would have to be held N-1 cycles). `-hold N-1` moves it back to edge 0, the original check.

**False path:** never functionally exercised or not meant to be timed: crossings between asynchronous clocks (better: `set_clock_groups -asynchronous`), static configuration registers, test-mode muxes, reset synchronizer input.

**Risks:** an overly broad false path or multicycle (wildcards) hides real violations; the RTL must actually guarantee the enable spacing (add an assertion), and CDC buses need `set_max_delay -datapath_only` rather than a bare false path.','["Static timing analysis","SDC"]','["multicycle path","false path","set_clock_groups","hold multiplier"]','Medium','[]','both','rtl','rtl-m4','https://docs.amd.com/r/en-US/ug949-vivado-design-methodology/Relaxing-the-Setup-Requirement-While-Keeping-Hold-Unchanged',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-sta-004','Physical design & timing','After synthesis your block fails setup by 150 ps at 1 GHz on a path from an address decoder through a wide mux into a register. What do you do, from RTL to physical fixes?','**First, read the path:** where is the delay (logic levels, a high-fanout net, a long wire, a slow macro output)? Is it a real path or a missing multicycle/false-path constraint?

**RTL fixes:**
- Pipeline: register the decoded select one cycle earlier (decode is often precomputable from the previous cycle''s address).
- One-hot select instead of an encoded select: an AND-OR mux is 2 levels; a binary mux tree on a late select is log2(N) levels.
- Move the late-arriving signal to the last mux level (Shannon expansion).
- Duplicate high-fanout registers (the select driving 64 bits).
- Retiming option in synthesis.

**Synthesis/physical fixes:** tighter path groups, upsizing and low-Vt swaps, buffering long nets, placement bounds to bring cells together, useful skew from a neighbor stage with slack.

**Re-check after each fix:** hold (faster cells can create hold violations), area/power, and that added latency is handled by the surrounding valid/ready logic.','["Static timing analysis","Timing closure"]','["critical path","one-hot mux","register duplication","retiming","Vt swap"]','Medium','[]','both','rtl','rtl-m4','https://www.youtube.com/watch?v=EZtRwBts9i8&list=PLx-Ml26M7ApIfR5VF0B7LKx0NYqMJ7GR4',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-sta-005','Physical design & timing','A shift register has no logic between flops: t_cq = 50 ps, t_hold = 20 ps. How much clock skew can it tolerate? What happens if skew is larger, and can you fix it after tape-out?','**Hold check:** t_cq + t_logic,min >= t_hold + skew -> 50 + 0 >= 20 + skew -> **skew <= 30 ps** (capture clock later than launch).

**If skew is larger:** the new data races through and is captured on the same edge: the shift register skips a stage (both flops get the same value). This fails at any frequency.

**Fixes before tape-out:** CTS balances skew; hold-fix buffers on the short data path (tools insert them after CTS); clock the chain in reverse order of data flow so skew helps; lockup latches between scan chains in different clock domains (the classic DFT case).

**After tape-out:** you cannot slow the clock to fix hold. Options are limited to process/voltage/temperature changes that shift delays, programmable clock delays if the design has them, or a metal-layer ECO / FIB edit.','["Static timing analysis"]','["hold time","clock skew","lockup latch","hold fixing"]','Medium','[]','both','rtl','rtl-m4','https://en.wikipedia.org/wiki/Static_timing_analysis',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-sta-006','Physical design & timing','How does timing analysis change for latch-based designs? Explain time borrowing with an example.','**Latch:** transparent while its enable is active (say clk high), holding otherwise. Data that arrives during the transparent phase passes through immediately.

**Time borrowing:** in a two-phase latch pipeline (L1 on clk high, L2 on clk low), a stage whose logic is too long for half a period can still work: its data arrives at L2 after L2 opens, flows through, and the **next** stage simply has less time. Max borrow is about the transparent-phase width minus the latch setup.

**Example:** T = 1 ns, 50% duty. Stage A logic 650 ps, stage B 300 ps (budget 500 ps each). With flops, A fails by 150 ps. With latches, A borrows 150 ps from B, which still has 500 - 300 = 200 ps of slack, so the loop closes.

**STA impact:** paths through transparent latches are analyzed across multiple stages; tools report borrowed time; the total loop must still fit, and hold checks become more delicate because both latches can be transparent briefly (need non-overlapping clocks or min-delay padding).

**Where used:** high-frequency custom datapaths (CPUs), latch-based register files, ICG cells.','["Static timing analysis"]','["latch","time borrowing","two-phase clocking"]','Hard','[]','both','rtl','rtl-m4','https://en.wikipedia.org/wiki/Static_timing_analysis',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-sta-007','Physical design & timing','What are OCV, AOCV/POCV and CRPR in signoff STA, and why do they matter for setup and hold?','**OCV (on-chip variation):** identical cells on one die differ in delay (local process, voltage drop, temperature). STA applies **derates**: for setup, launch clock + data late (e.g. +5%) and capture clock early (-5%); for hold the opposite. This is pessimistic on purpose.

**AOCV / POCV (LVF):** flat derates are too pessimistic for deep paths (random variation averages out over many stages). AOCV uses derates by depth/distance; POCV models each cell delay as mean + sigma and combines statistically, now standard at advanced nodes.

**CRPR / CPPR:** launch and capture clocks share a common segment of the clock tree. OCV applied it both late (launch) and early (capture), which is impossible for one physical path. CRPR credits back the difference. Example: 400 ps common path, +/-5% derate -> 420 vs 380 ps -> 40 ps credited.

**Corners:** setup at slow corners (SS, low V; check both temperature extremes because of temperature inversion), hold at fast corners (FF, high V). Multi-mode multi-corner (MMMC) runs all of them.

**Why an RTL designer cares:** your logic budget per stage shrinks by the margins; deep logic suffers more from flat OCV.','["Static timing analysis","Signoff"]','["OCV","AOCV","POCV","CRPR","corners","MMMC"]','Hard','[]','both','vlsi','vlsi-v2','https://chipedge.com/resources/what-is-crpr-in-vlsi/',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-dv-001','Verification','Write SVA for a 4-requester arbiter: grants are one-hot or zero, a grant only goes to a requester that is requesting, and every request is granted within 4 cycles.','```systemverilog
module arb_sva (input logic clk, rst_n, input logic [3:0] req, gnt);
  default clocking cb @(posedge clk); endclocking
  default disable iff (!rst_n);

  a_onehot:   assert property ($onehot0(gnt));
  a_only_req: assert property ((gnt & ~req) == 4''b0);
  for (genvar i = 0; i < 4; i++) begin : g
    a_live: assert property (req[i] |-> ##[0:4] gnt[i]);
    c_gnt:  cover  property (req[i] ##1 gnt[i]);
  end
endmodule
bind arbiter arb_sva u_sva (.*);
```

**Points to explain:**
- `|->` checks in the same cycle, `|=>` one cycle later (`a |=> b` == `a |-> ##1 b`).
- `##[0:4]` is a bounded liveness check; unbounded `s_eventually` is for formal.
- If requests may drop before a grant, the liveness property needs `req[i] throughout` or a different spec: ask what the protocol allows.
- `bind` attaches checkers without editing the RTL; add **cover** properties so you know the assertion was not vacuous.','["SVA"]','["concurrent assertion","$onehot0","implication","bind","cover property"]','Medium','[]','both','rtl','rtl-m5','https://www.chipverify.com/systemverilog/systemverilog-assertions',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-dv-002','Verification','Explain UVM phases, objections, the factory and uvm_config_db. Why does UVM need each of them?','**Phases:** give every component the same lifecycle so a large env builds and runs in a known order.
- `build_phase` (top-down): create children with the factory, get config.
- `connect_phase` (bottom-up): connect TLM ports (monitor analysis port -> scoreboard).
- `end_of_elaboration`, `start_of_simulation`: print topology, final checks.
- `run_phase` (task, the only one that consumes time; runs in parallel with reset/configure/main/shutdown sub-phases).
- `extract`, `check`, `report`, `final`: scoreboard checks and summary.

**Objections:** `phase.raise_objection(this)` / `drop_objection` in the test (or sequences) keep `run_phase` alive; when all are dropped (plus drain time), the phase ends. Forgetting to raise -> test ends at time 0.

**Factory:** components and objects are created with `type::type_id::create("name", this)`, so a test can call `set_type_override_by_type(base::get_type(), derived::get_type())` to swap a driver or a sequence item without editing the env.

**uvm_config_db:** hierarchical settings store: the top module puts the virtual interface (`uvm_config_db#(virtual fifo_if)::set(null, "uvm_test_top.*", "vif", vif)`), the driver/monitor `get` it in build_phase; also used for knobs like is_active and number of transactions.','["UVM"]','["phases","objections","factory","config_db","virtual interface"]','Medium','[]','both','rtl','rtl-m5','https://www.chipverify.com/uvm/uvm-phases',1);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-dv-003','Verification','Your testbench drives DUT inputs with blocking assignments at the clock edge and the results change between simulators. Why, and how do clocking blocks and program blocks fix it?','**Cause: a race.** The DUT flop samples `d` at posedge clk while the testbench also assigns `d` at posedge clk. The scheduler may run either process first, so the flop sees the old or new value depending on the simulator/order.

**Fixes:**
- **Clocking block:** `clocking cb @(posedge clk); default input #1step output #1; output d; input q; endclocking`. Inputs are sampled just before the edge (#1step = preponed values), outputs are driven a skew after the edge, so the TB behaves like a flop.
- **Program block / reactive region:** testbench code runs after the design settles in the time step.
- Simple Verilog rule: drive stimulus with nonblocking assignments or on the opposite edge (negedge), sample on posedge.

**In UVM:** drivers usually drive through a virtual interface clocking block (`vif.cb.d <= ...; @(vif.cb);`).','["Testbench"]','["race condition","clocking block","program block","scheduling regions"]','Medium','[]','both','rtl','rtl-m5','https://www.chipverify.com/systemverilog/systemverilog-clocking-blocks',0);
INSERT OR IGNORE INTO questions(id,category,question,answer_md,topics,concepts,difficulty,companies,role,track,module,source,common) VALUES('q2-dv-004','Verification','When would you use formal verification instead of (or alongside) simulation? What are its limits?','**Formal:** proves assertions for **all** input sequences up to a bound (or unbounded with induction), or returns a short counterexample trace.

**Good fits:** control-heavy blocks with small state: arbiters (fairness, one-hot), FIFOs (no overflow, data integrity with a tracked token), handshake/CDC protocols, FSM deadlock, register blocks, X-propagation and connectivity checks; equivalence checking (RTL vs netlist) is formal too.

**Limits:** state-space explosion on deep datapaths (multipliers, large memories), needs good constraints (assumptions) or it finds unrealistic failures; over-constraining hides bugs; bounded proofs only cover N cycles.

**Together:** simulation + UVM for end-to-end and performance scenarios with functional coverage; formal for corner cases simulation rarely hits; share the same SVA (assert in formal, assume at block boundaries, check in simulation).

**Open-source path to practice:** SymbiYosys with Yosys (ZipCPU tutorials).','["Formal verification"]','["formal","bounded model checking","assume/assert","equivalence checking"]','Medium','[]','both','rtl','rtl-m5','https://www.chipverify.com/systemverilog/systemverilog-assertions',0);
