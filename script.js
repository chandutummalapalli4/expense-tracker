$(document).ready(function(){
  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

  function saveExpenses(){ localStorage.setItem("expenses",JSON.stringify(expenses)); }

  function renderExpenses(filterMonth="", searchName="", sortBy=""){
    $("#expense-list").empty();
    let filtered = expenses.filter(exp=>{
      return (!filterMonth || exp.date.startsWith(filterMonth)) &&
             (!searchName || exp.name.toLowerCase().includes(searchName.toLowerCase()));
    });

    if(sortBy==="amount") filtered.sort((a,b)=>b.amount-a.amount);
    if(sortBy==="name") filtered.sort((a,b)=>a.name.localeCompare(b.name));
    if(sortBy==="date") filtered.sort((a,b)=> new Date(b.date)- new Date(a.date));

    let total=0, top=0;
    filtered.forEach((exp, idx)=>{
      const colors={Food:'primary', Travel:'success', Bills:'warning', Entertainment:'danger', Other:'secondary'};
      const item=$(`
        <li class="list-group-item shadow-sm">
          <div>
            <strong>${exp.name}</strong>
            <span class="badge bg-${colors[exp.category]} badge-category">${exp.category}</span><br>
            <small>${exp.date}</small>
          </div>
          <div>
            ₹${parseFloat(exp.amount).toFixed(2)}
            <button class="btn btn-warning btn-sm btn-edit" data-index="${idx}"><i class="bi bi-pencil-square"></i></button>
            <button class="btn btn-danger btn-sm btn-delete" data-index="${idx}"><i class="bi bi-trash"></i></button>
          </div>
        </li>
      `);
      $("#expense-list").append(item);
      total += parseFloat(exp.amount);
      if(exp.amount>top) top=exp.amount;
    });

    $("#total-amount").text(total.toFixed(2));
    $("#top-expense").text(top.toFixed(2));
    renderCharts(filtered);
  }

  function renderCharts(filteredExpenses){
    // Pie Chart - Category
    const catTotals={};
    filteredExpenses.forEach(e=>{catTotals[e.category]=(catTotals[e.category]||0)+parseFloat(e.amount);});
    const catCtx=document.getElementById('categoryChart').getContext('2d');
    if(window.categoryChart) window.categoryChart.destroy();
    window.categoryChart=new Chart(catCtx,{
      type:'pie',
      data:{ labels:Object.keys(catTotals), datasets:[{data:Object.values(catTotals),
        backgroundColor:['#0d6efd','#198754','#ffc107','#dc3545','#6c757d'], hoverOffset:15}] },
      options:{
        responsive:true,
        plugins:{legend:{position:'bottom'},
          tooltip:{callbacks:{label: function(ctx){
            let val=ctx.parsed, total=ctx.chart._metasets[0].total;
            return `${ctx.label}: ₹${val} (${((val/total)*100).toFixed(1)}%)`;
          }}}}
      }
    });

    // Bar Chart - Monthly
    const monthTotals={};
    filteredExpenses.forEach(e=>{monthTotals[e.date.slice(0,7)]=(monthTotals[e.date.slice(0,7)]||0)+parseFloat(e.amount);});
    const monthCtx=document.getElementById('monthlyChart').getContext('2d');
    if(window.monthlyChart) window.monthlyChart.destroy();
    const gradient=monthCtx.createLinearGradient(0,0,0,400);
    gradient.addColorStop(0,'#0d6efd'); gradient.addColorStop(1,'#0dcaf0');
    window.monthlyChart=new Chart(monthCtx,{
      type:'bar',
      data:{labels:Object.keys(monthTotals), datasets:[{label:'Monthly Expenses', data:Object.values(monthTotals), backgroundColor:gradient}]},
      options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
    });
  }

  // Add/Edit Expense
  $("#expense-form").submit(function(e){
    e.preventDefault();
    const name=$("#expense-name").val().trim();
    const amount=parseFloat($("#expense-amount").val());
    const date=$("#expense-date").val();
    const category=$("#expense-category").val();
    const editIndex=$("#edit-index").val();
    if(!name||!amount||!date||!category||amount<=0){alert("Enter valid details"); return;}
