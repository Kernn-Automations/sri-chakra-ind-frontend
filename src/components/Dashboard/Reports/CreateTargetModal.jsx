import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import targetService from "@/services/targetService";
import {
	DialogActionTrigger,
	DialogBody,
	DialogCloseTrigger,
	DialogContent,
	DialogRoot,
	DialogTrigger,
} from "@/components/ui/dialog";

function CreateTargetModal({ onCreated }) {
	const { axiosAPI } = useAuth();
	const API_BASE = import.meta.env.VITE_API_URL || "";

	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [isErrorOpen, setIsErrorOpen] = useState(false);
	const [successMsg, setSuccessMsg] = useState(null);

	// Form fields
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [targetType, setTargetType] = useState("sales"); // sales | customer
	const [assignmentType, setAssignmentType] = useState("team"); // team | employee
	const [budgetNumber, setBudgetNumber] = useState("");
	const [budgetUnit, setBudgetUnit] = useState("count"); // tons | bags | count
	const [timeFrame, setTimeFrame] = useState("months");
	const [timeFrameValue, setTimeFrameValue] = useState(1);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [priority, setPriority] = useState("medium"); // low | medium | high | critical
	const [notes, setNotes] = useState("");
	const [isRecurring, setIsRecurring] = useState(false);

	// Assignment-specific dropdown data
	const [teams, setTeams] = useState([]);
	const [employees, setEmployees] = useState([]);
	const [selectedTeamId, setSelectedTeamId] = useState("");
	const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

	const divisionParam = useMemo(() => {
		const currentDivisionId = localStorage.getItem("currentDivisionId");
		if (!currentDivisionId || currentDivisionId === "all") return undefined;
		const asNumber = Number(currentDivisionId);
		return Number.isFinite(asNumber) ? asNumber : undefined;
	}, []);

	const resetForm = () => {
		setName("");
		setDescription("");
		setTargetType("sales");
		setAssignmentType("team");
		setBudgetNumber("");
		setBudgetUnit("count");
		setTimeFrame("months");
		setTimeFrameValue(1);
		setStartDate("");
		setEndDate("");
		setPriority("medium");
		setNotes("");
		setIsRecurring(false);
		setTeams([]);
		setEmployees([]);
		setSelectedTeamId("");
		setSelectedEmployeeId("");
	};

	// Load dropdown lists when assignment type changes or modal opens
	useEffect(() => {
		async function loadLists() {
			try {
				const currentDivisionId = localStorage.getItem("currentDivisionId") || "1";
				console.log('Reports CreateTargetModal - Loading lists for division:', currentDivisionId, 'assignmentType:', assignmentType);
				
				// Load teams for team assignment
				if (assignmentType === "team") {
					console.log('Loading teams from /targets/dropdowns/teams...');
					try {
						// Use axiosAPI directly to match the API response format
						let endpoint = '/targets/dropdowns/teams';
						if (currentDivisionId && currentDivisionId !== '1') {
							endpoint += `?divisionId=${currentDivisionId}`;
						}
						
						const response = await axiosAPI.get(endpoint);
						const data = response.data;
						console.log('Teams API response:', data);
						
						// Parse response according to API documentation:
						// { "success": true, "teams": [...] }
						let teamsList = [];
						if (data?.success === true && data?.teams && Array.isArray(data.teams)) {
							teamsList = data.teams;
						} else if (data?.teams && Array.isArray(data.teams)) {
							teamsList = data.teams;
						} else if (Array.isArray(data)) {
							teamsList = data;
						}
						
						console.log('Extracted teams list:', teamsList);
						setTeams(teamsList);
						setEmployees([]);
						setSelectedEmployeeId("");
					} catch (error) {
						console.error('Error loading teams:', error);
						setTeams([]);
					}
				}
				// Load employees for employee assignment
				if (assignmentType === "employee") {
					console.log('Loading employees...');
					const res = await targetService.getEmployees(currentDivisionId);
					console.log('Employees response:', res);
					const list = res?.employees || [];
					console.log('Employees list:', list);
					setEmployees(Array.isArray(list) ? list : []);
					setTeams([]);
					setSelectedTeamId("");
				}
			} catch (e) {
				console.error("CreateTargetModal - failed to load lists", e);
			}
		}
		if (isOpen) loadLists();
	}, [assignmentType, isOpen]);

	const handleCreate = async () => {
		if (!name || !targetType || !assignmentType || !budgetNumber || !budgetUnit || !timeFrame || !timeFrameValue || !startDate || !endDate) {
			setError("Please fill all required fields");
			setIsErrorOpen(true);
			return;
		}
		if (assignmentType === "team" && !selectedTeamId) {
			setError("Please select a team");
			setIsErrorOpen(true);
			return;
		}
		if (assignmentType === "employee" && !selectedEmployeeId) {
			setError("Please select an employee");
			setIsErrorOpen(true);
			return;
		}
		try {
			setLoading(true);
			const payload = {
				name,
				description,
				targetType,
				assignmentType,
				budgetNumber: Number(budgetNumber),
				budgetUnit,
				timeFrame,
				timeFrameValue: Number(timeFrameValue),
				startDate,
				endDate,
				isRecurring,
				priority,
				notes,
				...(assignmentType === "team" && selectedTeamId ? { teamIds: [Number(selectedTeamId)] } : {}),
				...(assignmentType === "employee" && selectedEmployeeId ? { employeeIds: [Number(selectedEmployeeId)] } : {}),
				...(divisionParam ? { divisionId: divisionParam } : {}),
			};

			let response;
			try {
				const url = `${API_BASE}/targets/targets`;
				console.log("Creating target via", url, payload);
				response = await axiosAPI.post(url, payload);
			} catch (err) {
				const status = err?.response?.status;
				if (status === 404) {
					const url2 = `${API_BASE}/targets`;
					console.warn("/targets/targets returned 404. Retrying with", url2);
					response = await axiosAPI.post(url2, payload);
				} else {
					throw err;
				}
			}

			setSuccessMsg(response?.data?.message || "Target created successfully");
			if (onCreated) onCreated();
			resetForm();
			setTimeout(() => {
				setSuccessMsg(null);
				setIsOpen(false);
			}, 800);
		} catch (e) {
			console.error(e);
			setError(e?.response?.data?.message || "Failed to create target");
			setIsErrorOpen(true);
		} finally {
			setLoading(false);
		}
	};

	const handleOpenChange = (next) => {
		if (typeof next === "boolean") {
			setIsOpen(next);
		} else if (next && typeof next === "object" && "open" in next) {
			setIsOpen(!!next.open);
		} else {
			setIsOpen((prev) => !prev);
		}
	};

	return (
		<DialogRoot
			open={isOpen}
			onOpenChange={handleOpenChange}
			placement={"center"}
			size={"md"}
			modal={true}
			closeOnInteractOutside={true}
			closeOnEsc={true}
		>
			<DialogTrigger asChild>
				<button className="homebtn">+ Create Target</button>
			</DialogTrigger>
			<DialogContent className="mdl targets-create-modal">
				<DialogBody>
					<h3 className={`px-3 pb-3 mdl-title`}>Create Target</h3>

					<div className="row">
						{/* Left column */}
						<div className="col-6">
							<div className={`inputcolumn-mdl`}>
								<label>Name :</label>
								<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter target name" />
							</div>
							<div className={`inputcolumn-mdl`}>
								<label>Target Type :</label>
								<select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
									<option value="sales">Sales</option>
									<option value="customer">Customer</option>
								</select>
							</div>
				<div className={`inputcolumn-mdl`}>
								<label>Assignment Type :</label>
								<select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)}>
									<option value="team">Team</option>
									<option value="employee">Employee</option>
								</select>
							</div>
				{/* Conditional dropdown below Assignment Type */}
				{assignmentType === "team" && (
					<div className={`inputcolumn-mdl`}>
						<label>Team :</label>
						<select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}>
							<option value="">-- Select Team --</option>
							{console.log('Reports Teams state:', teams)}
							{teams.length === 0 && <option disabled>No teams available</option>}
							{teams
								.filter(team => team.isActive === true)
								.map((t) => {
									const teamHeadName = t.teamHead?.name || 'No Head';
									return (
										<option key={t.id} value={t.id}>
											{t.name} (Head: {teamHeadName})
										</option>
									);
								})}
						</select>
					</div>
				)}
				{assignmentType === "employee" && (
					<div className={`inputcolumn-mdl`}>
						<label>Employee :</label>
						<select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
							<option value="">-- Select Employee --</option>
							{console.log('Reports Employees state:', employees)}
							{employees.length === 0 && <option disabled>No employees available</option>}
							{employees
								.filter(employee => employee.status === 'Active')
								.map((emp) => {
									const primaryRole = emp.primaryRole || emp.roles?.[0]?.name || 'No Role';
									const teamStatus = emp.teamStatus === 'IN' ? 'In Team' : 'Not in Team';
									const currentTeam = emp.currentTeam?.name;
									const teamContext = currentTeam ? ` (${teamStatus}: ${currentTeam})` : ` (${teamStatus})`;
									return (
										<option key={emp.id} value={emp.id}>
											{emp.name} - {primaryRole}{teamContext}
										</option>
									);
								})}
						</select>
					</div>
				)}
							<div className={`inputcolumn-mdl`}>
								<label>Budget Number :</label>
								<input type="number" value={budgetNumber} onChange={(e) => setBudgetNumber(e.target.value)} placeholder="e.g. 100000" />
							</div>
							<div className={`inputcolumn-mdl`}>
								<label>Budget Unit :</label>
								<select value={budgetUnit} onChange={(e) => setBudgetUnit(e.target.value)}>
									<option value="count">Count</option>
									<option value="bags">Bags</option>
									<option value="tons">Tons</option>
								</select>
							</div>
							<div className={`inputcolumn-mdl`}>
								<label>Time Frame</label>
								<select value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
									<option value="months">Months</option>
								</select>
							</div>
							<div className={`inputcolumn-mdl`}>
								<label>Description:</label>
								<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the target"></textarea>
							</div>
						</div>

						{/* Right column */}
						<div className="col-6">
							<div className={`inputcolumn-mdl`}>
								<label>Value :</label>
								<input type="number" value={timeFrameValue} onChange={(e) => setTimeFrameValue(e.target.value)} />
							</div>
							<div className={`inputcolumn-mdl`}>
								<label>Start Date :</label>
								<input type="date" placeholder="dd-mm-yyyy" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
							</div>
							<div className={`inputcolumn-mdl`}>
								<label>End Date :</label>
								<input type="date" placeholder="dd-mm-yyyy" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
							</div>
							<div className={`inputcolumn-mdl`}>
								<label>Priority :</label>
								<select value={priority} onChange={(e) => setPriority(e.target.value)}>
									<option value="low">Low</option>
									<option value="medium">Medium</option>
									<option value="high">High</option>
									<option value="critical">Critical</option>
								</select>
							</div>
							<div className={`inputcolumn-mdl`}>
								<label>Recurring :</label>
								<input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
							</div>
							<div className={`inputcolumn-mdl`}>
								<label>Notes:</label>
								<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes"></textarea>
							</div>
						</div>
					</div>

					{!loading && !successMsg && (
						<div className="row pt-3 mt-3 justify-content-center">
							<div className={`col-6`}>
								<button type="button" className={`submitbtn`} onClick={handleCreate}>Create</button>
								<DialogActionTrigger asChild>
									<button type="button" className={`cancelbtn`}>Close</button>
								</DialogActionTrigger>
							</div>
						</div>
					)}

					{loading && (
						<div className="row pt-3 mt-3 justify-content-center">
							<div className={`col-6`}>
								<Loading />
							</div>
						</div>
					)}

					{successMsg && (
						<div className="row pt-3 mt-3 justify-content-center">
							<div className={`col-6`}>
								<DialogActionTrigger asChild>
									<button type="button" className={`submitbtn`}>{successMsg}</button>
								</DialogActionTrigger>
							</div>
						</div>
					)}

					{isErrorOpen && (
						<ErrorModal isOpen={isErrorOpen} message={error} onClose={() => setIsErrorOpen(false)} />
					)}
				</DialogBody>
				<DialogCloseTrigger className="inputcolumn-mdl-close" />
			</DialogContent>
		</DialogRoot>
	);
}

export default CreateTargetModal;
