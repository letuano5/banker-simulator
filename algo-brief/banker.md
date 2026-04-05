# Input

n = số tiến trình, m = số nguồn tài nguyên
- Available: mảng gồm m phần tử. Nếu Available [j] = k, thì có k đơn vị tài nguyên Rj có sẵn
- Max: Ma trận n x m. Nếu Max [i,j] = k, thì tiến trình Pi được yêu cầu nhiều nhất k đơn vị tài nguyên Rj
- Allocation: Ma trận n x m. Nếu Allocation[i,j] = k thì Pi đang chiếm giữ k đơn vị của Rj
- Need: Ma trận n x m. Nếu Need[i,j] = k, thì Pi có thể cần thêm k đơn vị của Rj để hoàn thành nhiệm vụ
  - Need [i,j] = Max[i,j] – Allocation[i,j]

# Thuật toán

1. Work và Finish là hai mảng có độ dài m và n. Khởi tạo:
Work = Available
Finish [i] = false với i = 0, 1, …, n- 1
2. Tìm i sao cho thoả mãn
(a) Finish [i] = false
(b) Need[i] ≤ Work
Nếu không có i thoả mãn, chuyển sang bước 4
3. Work = Work + Allocationi
Finish[i] = true
Chuyển sang bước 2
4. Nếu Finish [i] == true với tất cả i, thì hệ thống ở trạng thái an
toàn