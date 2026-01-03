export function PrivateInfoTab({ employee }) {
  const privateInfo = {
    dateOfBirth: employee?.dateOfBirth || employee?.dob,
    residingAddress: employee?.address || employee?.residingAddress,
    nationality: employee?.nationality,
    personalEmail: employee?.personalEmail,
    gender: employee?.gender,
    maritalStatus: employee?.maritalStatus,
    dateOfJoining: employee?.dateOfJoining || employee?.joiningDate,
  }

  const bankDetails = {
    accountNumber: employee?.bankAccountNumber || employee?.accountNumber,
    bankName: employee?.bankName,
    ifscCode: employee?.ifsc || employee?.ifscCode,
    panNo: employee?.pan || employee?.panNo,
    uanNo: employee?.uan || employee?.uanNo,
    empCode: employee?.employeeCode || employee?.empCode,
  }

  function Row({ label, value }) {
    return (
      <div className="flex items-end gap-4">
        <div className="w-36 text-sm text-muted-foreground">{label}</div>
        <div className="flex-1 border-b pb-1 text-sm font-medium">{value || '—'}</div>
      </div>
    )
  }

  return (
    <div className="mt-4 grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="text-sm font-medium">Private Info</div>
        <div className="space-y-4">
          <Row label="Date of Birth" value={privateInfo.dateOfBirth} />
          <Row label="Residing Address" value={privateInfo.residingAddress} />
          <Row label="Nationality" value={privateInfo.nationality} />
          <Row label="Personal Email" value={privateInfo.personalEmail} />
          <Row label="Gender" value={privateInfo.gender} />
          <Row label="Marital Status" value={privateInfo.maritalStatus} />
          <Row label="Date of Joining" value={privateInfo.dateOfJoining} />
        </div>
      </div>

      <div className="space-y-5 lg:border-l lg:pl-8">
        <div className="text-sm font-medium">Bank Details</div>
        <div className="space-y-4">
          <Row label="Account Number" value={bankDetails.accountNumber} />
          <Row label="Bank Name" value={bankDetails.bankName} />
          <Row label="IFSC Code" value={bankDetails.ifscCode} />
          <Row label="PAN No" value={bankDetails.panNo} />
          <Row label="UAN No" value={bankDetails.uanNo} />
          <Row label="Emp Code" value={bankDetails.empCode} />
        </div>
      </div>
    </div>
  )
}
