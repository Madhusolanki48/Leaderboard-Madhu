document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch("http://localhost:3001/data");
        const data = await response.json();
        let filteredData = [...data];
        let pinnedStudent = null;
        const leaderboardBody = document.getElementById('leaderboard-body');
        const sectionFilter = document.getElementById('section-filter');
        const clearPinButton = document.getElementById('clear-pin');

        // Populate section filter dropdown
        const populateSectionFilter = () => {
            const sections = [...new Set(data.map(student => student.section || 'N/A'))].sort();
            sectionFilter.innerHTML = '<option value="all">All Sections</option>';
            sections.forEach(section => {
                const option = document.createElement('option');
                option.value = section;
                option.textContent = section;
                sectionFilter.appendChild(option);
            });
        };

        // Function to export data to CSV
        const exportToCSV = (data) => {
            const headers = ['Rank', 'Roll Number', 'Name', 'Section', 'Total Solved', 'Easy', 'Medium', 'Hard', 'LeetCode URL'];
            const csvRows = data.map((student, index) => {
                return [
                    index + 1,
                    student.roll,
                    student.name,
                    student.section || 'N/A',
                    student.totalSolved || 'N/A',
                    student.easySolved || 'N/A',
                    student.mediumSolved || 'N/A',
                    student.hardSolved || 'N/A',
                    student.url
                ].join(',');
            });
            
            const csvContent = [headers.join(','), ...csvRows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'leaderboard.csv');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // Function to handle pinning
        const handlePin = (student) => {
            pinnedStudent = student;
            clearPinButton.classList.remove('hidden');
            renderLeaderboard(filteredData);
        };

        // Function to clear pin
        const clearPin = () => {
            pinnedStudent = null;
            clearPinButton.classList.add('hidden');
            renderLeaderboard(filteredData);
        };

        // Function to render the leaderboard
        const renderLeaderboard = (sortedData) => {
            leaderboardBody.innerHTML = '';
            
            // Create a copy of the data to modify
            let displayData = [...sortedData];
            
            // If there's a pinned student, remove them from the main list and add them at the top
            if (pinnedStudent) {
                displayData = displayData.filter(student => student.roll !== pinnedStudent.roll);
                displayData.unshift(pinnedStudent);
            }
            
            displayData.forEach((student, index) => {
                const row = document.createElement('tr');
                row.classList.add('border-b', 'border-gray-700', 'hover-pin');
                
                // Add pinned class if this is the pinned student
                if (pinnedStudent && student.roll === pinnedStudent.roll) {
                    row.classList.add('pinned-row');
                }
                
                row.innerHTML = `
                    <td class="p-4">${index + 1}</td>
                    <td class="p-4">${student.roll}</td>
                    <td class="p-4">
                        ${student.url.startsWith('https://leetcode.com/u/') 
                            ? `<a href="${student.url}" target="_blank" class="text-blue-400">${student.name}</a>`
                            : `<div class="text-red-500">${student.name}</div>`}
                    </td>
                    <td class="p-4">${student.section || 'N/A'}</td>
                    <td class="p-4">${student.totalSolved || 'N/A'}</td>
                    <td class="p-4 text-green-400">${student.easySolved || 'N/A'}</td>
                    <td class="p-4 text-yellow-400">${student.mediumSolved || 'N/A'}</td>
                    <td class="p-4 text-red-400">${student.hardSolved || 'N/A'}</td>
                `;
                
                // Add click handler for pinning
                row.addEventListener('click', () => handlePin(student));
                
                leaderboardBody.appendChild(row);
            });
        };

        // Filter function
        const filterData = (section) => {
            filteredData = section === 'all' 
                ? [...data]
                : data.filter(student => (student.section || 'N/A') === section);
            renderLeaderboard(filteredData);
        };

        // Sorting logic
        let totalSolvedDirection = 'desc';
        let easySolvedDirection = 'desc';
        let mediumSolvedDirection = 'desc';
        let hardSolvedDirection = 'desc';
        let sectionDirection = 'asc';

        const sortData = (data, field, direction, isNumeric = false) => {
            return data.sort((a, b) => {
                const valA = a[field] || (isNumeric ? 0 : 'Z');
                const valB = b[field] || (isNumeric ? 0 : 'Z');
                if (isNumeric) {
                    return direction === 'desc' ? valB - valA : valA - valB;
                } else {
                    return direction === 'desc'
                        ? valB.toString().localeCompare(valA.toString())
                        : valA.toString().localeCompare(valB.toString());
                }
            });
        };

        // Initialize the page
        populateSectionFilter();
        renderLeaderboard(data);

        // Event Listeners
        clearPinButton.addEventListener('click', clearPin);

        sectionFilter.addEventListener('change', (e) => {
            filterData(e.target.value);
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            exportToCSV(filteredData);
        });

        // Sorting event listeners
        document.getElementById('sort-section').addEventListener('click', () => {
            sectionDirection = sectionDirection === 'desc' ? 'asc' : 'desc';
            const sortedData = sortData(filteredData, 'section', sectionDirection, false);
            renderLeaderboard(sortedData);
        });

        document.getElementById('sort-total').addEventListener('click', () => {
            totalSolvedDirection = totalSolvedDirection === 'desc' ? 'asc' : 'desc';
            const sortedData = sortData(filteredData, 'totalSolved', totalSolvedDirection, true);
            renderLeaderboard(sortedData);
        });

        document.getElementById('sort-easy').addEventListener('click', () => {
            easySolvedDirection = easySolvedDirection === 'desc' ? 'asc' : 'desc';
            const sortedData = sortData(filteredData, 'easySolved', easySolvedDirection, true);
            renderLeaderboard(sortedData);
        });

        document.getElementById('sort-medium').addEventListener('click', () => {
            mediumSolvedDirection = mediumSolvedDirection === 'desc' ? 'asc' : 'desc';
            const sortedData = sortData(filteredData, 'mediumSolved', mediumSolvedDirection, true);
            renderLeaderboard(sortedData);
        });

        document.getElementById('sort-hard').addEventListener('click', () => {
            hardSolvedDirection = hardSolvedDirection === 'desc' ? 'asc' : 'desc';
            const sortedData = sortData(filteredData, 'hardSolved', hardSolvedDirection, true);
            renderLeaderboard(sortedData);
        });

    } catch (error) {
        console.error('Error fetching data:', error);
    }
});