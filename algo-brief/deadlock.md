# Input

- n = số tiến trình, m = số nguồn tài nguyên
- Available: mảng gồm m phần tử. Nếu Available [j] = k, thì có k đơn vị tài nguyên Rj có sẵn
- Allocation: Ma trận n x m. Nếu Allocation[i,j] = k thì Pi đang chiếm giữ k đơn vị của Rj
- Request: Ma trận n x m. Nếu Request[i,j] = k, thì Pi đang yêu cầu thêm k đơn vị của Rj

1. Work và Finish là hai mảng có độ dài m và n. Khởi tạo:
(a) Work = Available
(b) Với i = 0, 1, …, n- 1, nếu Allocationi ≠ 0 thì Finish [i] = false, ngược lại Finish
[i] = true
2. Tìm i sao cho thoả mãn
(a) Finish [i] = false
(b) Requesti ≤ Work
Nếu không có i thoả mãn, chuyển sang bước 4
3. Work = Work + Allocationi
Finish[i] = true
Chuyển sang bước 2
4. Nếu Finish [i] == false với một số 0 ≤ i ≤ n-1, thì hệ thống ở trạng thái bế tắc.
Và nếu Finish [i] == false thì Pi
 bị bế tắc