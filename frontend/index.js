document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch("http://localhost:3001/data");
        const data = await response.json();
        let filteredData = [...data]; // Keep original data separate
        let pinnedStudent = null; // Track pinned student
        const leaderboardBody = document.getElementById('leaderboard-body');
        const sectionFilter = document.getElementById('section-filter');
        const searchInput = document.getElementById('search-input');
        const clearPinBtn = document.getElementById('clear-pin');

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

        // Function to handle pinning a student
        const pinStudent = (student) => {
            pinnedStudent = student;
            clearPinBtn.classList.remove('hidden');
            renderLeaderboard(filteredData);
        };

        // Function to clear pinned student
        const clearPin = () => {
            pinnedStudent = null;
            clearPinBtn.classList.add('hidden');
            renderLeaderboard(filteredData);
        };

        // Function to render the leaderboard
        const renderLeaderboard = (sortedData) => {
            leaderboardBody.innerHTML = '';

            // Render pinned student first if exists
            if (pinnedStudent) {
                const pinnedRow = createStudentRow(pinnedStudent, -1, true);
                leaderboardBody.appendChild(pinnedRow);
            }

            // Render rest of the students
            sortedData.forEach((student, index) => {
                if (pinnedStudent && student.roll === pinnedStudent.roll) return; // Skip pinned student
                const row = createStudentRow(student, index);
                leaderboardBody.appendChild(row);
            });
        };

        // Function to create a student row
        const createStudentRow = (student, index, isPinned = false) => {
            const row = document.createElement('tr');
            row.classList.add('border-b', 'border-gray-700', 'hover-pin');
            if (isPinned) {
                row.classList.add('pinned-row');
            }
            
            const rank = isPinned ? '★' : (index + 1);
            
            row.innerHTML = `
                <td class="p-4">${rank}</td>
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

            // Add pin functionality
            row.addEventListener('dblclick', () => {
                if (!isPinned) {
                    pinStudent(student);
                }
            });

            return row;
        };

        // Enhanced filter function to include search
        const filterData = (section, searchTerm = '') => {
            filteredData = data.filter(student => {
                const matchesSection = section === 'all' || (student.section || 'N/A') === section;
                const matchesSearch = searchTerm === '' || 
                    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    student.roll.toLowerCase().includes(searchTerm.toLowerCase());
                
                return matchesSection && matchesSearch;
            });
            renderLeaderboard(filteredData);
        };

        // Sorting logic with ascending and descending functionality
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

        // Search input event listener
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            const currentSection = sectionFilter.value;
            filterData(currentSection, searchTerm);
        });

        // Section filter event listener
        sectionFilter.addEventListener('change', (e) => {
            const searchTerm = searchInput.value;
            filterData(e.target.value, searchTerm);
        });

        // Clear pin button event listener
        clearPinBtn.addEventListener('click', clearPin);

        // Export button event listener
        document.getElementById('export-btn').addEventListener('click', () => {
            exportToCSV(filteredData); // Export only filtered data
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
        document.getElementById('error-state').classList.remove('hidden');
    }
});