# Financial Ledger Expansion Design

## Mục tiêu

Nâng cấp hệ thống tài chính theo hướng dữ liệu liên kết chặt, theo dõi được luồng tiền vào/ra, công nợ, lương công nhân, và nguồn phát sinh chi phí. Phạm vi này bao trùm các màn hình và nghiệp vụ:

- `accounts`
- `expenses`
- `debts` / `payments`
- `workers`
- `attendance` / tính lương
- `purchase orders`
- thông báo và lịch sử thay đổi

Mục tiêu chính là tránh dữ liệu mồ côi, tránh số liệu phình do bản ghi test/xóa/sửa nhiều lần, và làm cho mọi cập nhật đều có trạng thái rõ ràng, có thể truy vết.

## Hiện trạng

Codebase hiện đang tách thành nhiều khối độc lập:

- `Account` có `balance`, `Transaction` có lịch sử nhưng chưa nối chặt với `Expense`, `Debt`, `Payment`, `Worker`
- `Expense` là bảng riêng, có `projectId`, `categoryId`, `status`, nhưng chưa có `accountId`, `purchaseOrderId`, `targetType`, `targetId`
- `Debt` gắn với `Supplier` hoặc `Worker`, nhưng chưa có lớp kế toán chung để đối soát tiền đã chi/đã trả
- `Worker` mới có `phone`, `idCard`, `skill`, `dailyWage`, chưa có thông tin ngân hàng/MST/số tài khoản/tên chủ tài khoản
- `Supplier` có `taxCode` nhưng chưa có dữ liệu ngân hàng đầy đủ
- `Notification` và `AuditLog` đã tồn tại nhưng chưa được dùng đồng bộ cho các mutation tài chính
- `/expenses` chỉ tổng hợp trực tiếp từ bảng expense nên nếu test data hoặc bản ghi soft-delete không được filter nhất quán thì số liệu dễ lệch

Hiện trạng này đúng với triệu chứng bạn mô tả: xóa test ở chỗ này nhưng số liệu chỗ khác vẫn tăng vì dữ liệu chưa có khóa và chưa có điểm ghi nhận thống nhất.

## Quyết định kiến trúc

### 1. Không đổi sang một sổ cái duy nhất ngay

Chưa gom toàn bộ sang một ledger model duy nhất ở pha này. Thay vào đó:

- giữ `Account`, `Expense`, `Debt`, `Payment`, `Transaction`, `Worker`, `Supplier` là các bảng domain riêng
- thêm liên kết bắt buộc ở nơi cần thiết để không có bản ghi mồ côi
- tạo lịch sử thay đổi và thông báo đồng bộ ở tầng mutation

Đây là hướng an toàn hơn, ít rủi ro hơn so với tái thiết toàn bộ kế toán.

### 2. `PurchaseOrder` là nguồn phát sinh `Expense` có kiểm soát

Chấp nhận mô hình lai:

- `PurchaseOrder` vẫn là nguồn tham chiếu
- khi `PurchaseOrder` chuyển sang `RECEIVED`, hệ thống tự tạo đúng 1 `Expense` liên kết 1-1 với đơn đó
- expense sinh tự động phải nhận diện được là từ PO, không được tạo trùng
- khi `PurchaseOrder` bị soft-delete, expense sinh ra từ nó cũng soft-delete theo
- expense vẫn có thể tạo tay nếu người dùng cần chi ngoài PO

### 3. `Expense` phải biết chi từ đâu và cho ai

`Expense` cần thêm metadata để trả lời các câu:

- chi từ tài khoản nào
- chi cho đối tượng nào
- có thuộc PO nào không
- có tạo từ nghiệp vụ nào không

### 4. `Debt` và `Payment` phải đối soát theo đối tượng

`Debt` vẫn tách theo `Supplier`/`Worker`, nhưng:

- payment phải biết trừ công nợ nào
- đối tượng liên quan phải hiển thị số đã thanh toán, còn lại bao nhiêu
- xóa/sửa payment phải cập nhật lại số dư công nợ và lịch sử liên quan

### 5. `Worker` phải đủ thông tin thanh toán

`Worker` cần lưu:

- số tài khoản
- ngân hàng
- tên chủ tài khoản
- mã số thuế nếu có
- ghi chú tài chính nếu cần

### 6. Mọi mutation quan trọng phải có phản hồi rõ ràng

Mỗi thao tác create/update/delete/status change cần:

- toast thành công hoặc lỗi
- revalidate đúng trang
- ghi `AuditLog` cho thay đổi quan trọng
- tạo `Notification` khi mutation ảnh hưởng tới người khác hoặc luồng xử lý cần theo dõi

## Thiết kế dữ liệu

### Account

Mở rộng `Account` để phục vụ theo dõi tiền vào/ra tốt hơn:

- giữ `name`, `type`, `balance`, `currency`
- thêm trường mô tả nguồn vốn nếu cần phân loại
- lịch sử vào/ra vẫn đi qua `Transaction`

### Transaction

`Transaction` tiếp tục là lịch sử tiền vào/ra của tài khoản, nhưng sẽ được dùng nhiều hơn:

- ghi nhận chi tiền, thu tiền, thanh toán lương, thanh toán công nợ, điều chỉnh số dư
- thêm `reference`/`description` nếu cần truy vết tới expense, debt payment, payroll

### Expense

Thêm các liên kết sau:

- `origin` enum để phân biệt nguồn: `MANUAL`, `PURCHASE_ORDER`, `PAYROLL`, `DEBT_PAYMENT`, `ADJUSTMENT`
- `accountId` dùng để biết tiền đi từ tài khoản nào; với expense đã duyệt hoặc đã chi thì phải có `accountId`
- `purchaseOrderId` nullable, dùng cho expense sinh từ PO và phải là liên kết 1-1
- `supplierId` nullable, dùng khi expense trả cho nhà cung cấp cụ thể
- `workerId` nullable, dùng khi expense trả cho công nhân hoặc trả lương
- `payeeName` nullable, dùng cho trường hợp chi cho đối tượng ngoài hệ thống
- `transactionId` nullable, dùng để nối expense với giao dịch thực chi nếu đã phát sinh trên tài khoản

Quy tắc:

- expense thủ công vẫn được phép
- expense sinh từ PO phải giữ liên kết 1-1 với PO
- expense soft-delete phải không còn được tính ở dashboard/report

### PurchaseOrder

Thêm quan hệ ngược để biết PO nào đã sinh expense:

- `expenseId` hoặc quan hệ 1-1 tương đương
- trạng thái `RECEIVED` là điểm kích hoạt tạo expense tự động

### Worker

Mở rộng `Worker`:

- `bankName`
- `bankAccountNumber`
- `bankAccountHolder`
- `taxCode`
- `bankBranch` nếu cần
- giữ `dailyWage`, `notes`, `status`

### Supplier

Mở rộng `Supplier`:

- `bankName`
- `bankAccountNumber`
- `bankAccountHolder`
- `taxCode`
- `bankBranch` nếu cần
- `notes` vẫn giữ để lưu thông tin khác

### Debt / Payment

`Debt` giữ quan hệ với `Supplier` hoặc `Worker`, nhưng cần thêm:

- liên kết rõ ràng với các payment
- trường tính toán được phần còn lại dựa trên `amount - paidAmount`
- `Payment` phải lưu `accountId` để biết trừ tiền ở tài khoản nào
- `Payment` có thể lưu `transactionId` nếu chi tiền thật đã tạo giao dịch tài khoản
- nếu payment bị sửa hoặc xóa thì `paidAmount`, `status`, và lịch sử tài khoản phải được tính lại

### Payroll / Lương

Giai đoạn này không dựng một hệ payroll hoàn toàn mới ngay lập tức. Thay vào đó:

- chấm công hiện tại là dữ liệu đầu vào
- tính lương cần xem theo công, lương ngày, phụ cấp/khấu trừ nếu có
- lương phải sinh ra một khoản phải trả hoặc payment rõ ràng

Nếu cần tạo bảng riêng cho lương, phải tách thành:

- bảng tính lương theo kỳ
- bảng dòng lương theo công nhân
- liên kết sang debt/payment hoặc transaction

## Luồng nghiệp vụ

### 1. Tạo hoặc nhận `PurchaseOrder`

Khi PO chuyển sang `RECEIVED`:

1. kiểm tra PO chưa bị soft-delete
2. kiểm tra đã có expense tự động chưa
3. nếu chưa có, tạo `Expense` liên kết với PO
4. cập nhật lịch sử và thông báo
5. revalidate `/purchase-orders`, `/expenses`, các trang project liên quan

### 2. Xóa `PurchaseOrder`

Khi soft-delete PO:

1. soft-delete expense liên kết nếu expense đó sinh từ PO
2. giữ expense thủ công độc lập không bị xóa theo
3. ghi audit log
4. toast thông báo xóa thành công

### 3. Tạo chi phí thủ công

Khi tạo expense tay:

1. chọn category
2. chọn project scope hiện tại
3. chọn account chi tiền nếu có
4. chọn người nhận/chủ thể chi nếu có
5. tạo expense
6. nếu có transaction thực chi, tạo transaction song song hoặc ngay sau đó

### 4. Thanh toán công nợ

Khi tạo payment:

1. chọn debt
2. chọn tài khoản chi
3. trừ số dư account nếu payment là chi tiền thật
4. cộng paidAmount cho debt
5. cập nhật status debt theo số còn lại
6. tạo audit log và notification nếu cần

### 5. Tính lương công nhân

Khi tính lương từ chấm công:

1. lấy attendance theo kỳ
2. tính số công, số ngày đi làm, ngày nghỉ, ngày đi trễ nếu chính sách cho phép
3. sinh khoản phải trả cho worker
4. nếu đã chi lương, tạo transaction/payment tương ứng
5. lưu lịch sử kỳ lương để xem đã trả theo kỳ nào, còn nợ bao nhiêu

### 6. Cập nhật thông tin công nhân / nhà cung cấp

Khi cập nhật worker/supplier:

1. validate dữ liệu ngân hàng và MST
2. cập nhật model
3. ghi audit log
4. toast thành công hoặc lỗi

## Phạm vi màn hình

### Accounts page

Nâng cấp để có:

- danh sách tài khoản
- chỉnh sửa balance và metadata
- lịch sử tiền vào / tiền ra
- lọc theo loại giao dịch
- biết giao dịch nào liên quan expense / debt / payroll / adjustment

### Expenses page

Nâng cấp để có:

- tạo expense thủ công
- hiển thị account chi
- hiển thị nguồn phát sinh
- hiển thị trạng thái và lịch sử thay đổi
- tránh đếm trùng bản ghi soft-delete

### Workers page

Nâng cấp để có:

- thông tin ngân hàng
- mã số thuế
- trạng thái làm việc
- lịch sử công / lịch sử lương
- khoản đã trả và còn nợ

### Debts page

Nâng cấp để có:

- công nợ nhà cung cấp
- công nợ công nhân
- payment history
- đối chiếu trạng thái theo từng đối tượng

### Purchase orders page

Nâng cấp để có:

- trạng thái tạo expense tự động
- dấu hiệu đã sinh expense chưa
- xử lý soft-delete an toàn

### Notifications / audit

- thông báo toast ngay trên màn hình hiện hành
- audit log lưu trong DB
- notification cho các biến cố tài chính quan trọng

## Xử lý lỗi

Mỗi mutation phải phân biệt 3 nhóm lỗi:

1. lỗi validate dữ liệu đầu vào
2. lỗi không tìm thấy bản ghi liên quan
3. lỗi nghiệp vụ, ví dụ:
   - PO đã có expense tự động
   - account bị xóa
   - debt đã thanh toán vượt số tiền còn lại
   - worker/supplier thiếu thông tin bắt buộc

Thông điệp lỗi phải ngắn, cụ thể, và hiển thị bằng toast hoặc dialog phù hợp.

## Kiểm thử

Các test bắt buộc:

- tạo `PurchaseOrder` rồi chuyển `RECEIVED` tạo đúng 1 `Expense`
- soft-delete `PurchaseOrder` kéo theo `Expense` tự động
- expense thủ công không bị xóa theo PO
- tạo payment cập nhật `Debt.paidAmount` và status
- tạo transaction cập nhật số dư `Account`
- update worker/supplier có trường ngân hàng/MST
- toast/error path cho mutation thất bại
- dashboard/report không tính bản ghi `deletedAt`

Ngoài unit test, cần ít nhất một số test tích hợp hoặc E2E cho:

- tạo PO
- nhận hàng
- thấy expense sinh ra
- xóa PO
- thấy expense tự động bị ẩn

## Tác động mã nguồn

Dự kiến chạm vào:

- `prisma/schema.prisma`
- `prisma/migrations/*`
- `prisma/seed.ts`
- `src/actions/financial.ts`
- `src/actions/purchase-orders.ts`
- `src/actions/workers.ts`
- `src/actions/suppliers.ts`
- `src/actions/notifications.ts`
- `src/actions/reports.ts`
- `src/app/(dashboard)/accounts/*`
- `src/app/(dashboard)/expenses/*`
- `src/app/(dashboard)/workers/*`
- `src/app/(dashboard)/debts/*`
- form components liên quan
- schema validation trong `src/schemas/*`

## Giới hạn

- Chưa triển khai full ledger engine ngay
- Chưa chuẩn hóa payroll thành một hệ kế toán riêng nếu chưa cần
- Chưa tự động suy diễn toàn bộ nghiệp vụ từ inventory sang expense nếu không có nguồn dữ liệu rõ
- Không đổi dữ liệu cũ theo cách phá số liệu hiện có; mọi migration phải có đường chuyển đổi an toàn

## Kế hoạch triển khai

Pha 1:

- mở rộng schema cho `Worker`, `Supplier`, `Account`, `Expense`, `PurchaseOrder`, `Debt`, `Payment`
- thêm quan hệ và field cần thiết

Pha 2:

- sửa server actions cho create/update/delete/revalidate
- thêm audit log và notification cho mutation chính

Pha 3:

- nâng cấp UI `accounts`, `expenses`, `workers`, `debts`, `purchase-orders`
- thêm lịch sử và trạng thái chi tiết

Pha 4:

- thêm test cho luồng PO -> expense, debt/payment, account transaction, worker metadata
- kiểm tra dữ liệu soft-delete và filter report
