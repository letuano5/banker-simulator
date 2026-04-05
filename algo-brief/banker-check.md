# Thuật toán kiểm tra yêu cầu cấp phát tài nguyên cho Pi

## Input

n = số tiến trình, m = số nguồn tài nguyên
- Available: mảng gồm m phần tử. Nếu Available [j] = k, thì có k đơn vị tài nguyên Rj có sẵn
- Max: Ma trận n x m. Nếu Max [i,j] = k, thì tiến trình Pi được yêu cầu nhiều nhất k đơn vị tài nguyên Rj
- Allocation: Ma trận n x m. Nếu Allocation[i,j] = k thì Pi đang chiếm giữ k đơn vị của Rj
- Need: Ma trận n x m. Nếu Need[i,j] = k, thì Pi có thể cần thêm k đơn vị của Rj để hoàn thành nhiệm vụ
  - Need [i,j] = Max[i,j] – Allocation[i,j]
  
Request = mảng yêu cầu tài nguyên của P[i]. Nếu Request[j] = k thì P_i muốn k đơn vị của tài nguyên R_j

## Thuật toán

1. Nếu Request[i] ≤ Need[i] thì sang bước 2. Nếu không thì thông náo lỗi vì tiến trình sử dụng quá số lượng tài nguyên tối đa đã khai báo.
2. Nếu Request[i] ≤ Available, thì sang bước 3. Nếu không P[i] phải chờ vì tài nguyên không sẵn sàng.
3. Giả định rằng cấp phát tài nguyên cho P[i] thông qua câu lệnh sau:
   Available = Available – Request[i]
   Allocation[i] = Allocation[i] - Request[i]
   Need[i] = Need[i] - Request[i]
  - Nếu an toàn thì tài nguyên được cấp phát cho P[i]
  - Nếu không an toàn ⇒ Pi phải chờ, trạng thái cấp phát tài nguyên trước được hồi phục
