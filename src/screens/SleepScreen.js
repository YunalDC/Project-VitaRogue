import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

const SleepScreen = () => {
  const [sleepData, setSleepData] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  
  // New state for date and time pickers
  const [bedDateTime, setBedDateTime] = useState(new Date());
  const [wakeDateTime, setWakeDateTime] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);
    return tomorrow;
  });
  
  // Picker visibility states
  const [showBedDatePicker, setShowBedDatePicker] = useState(false);
  const [showBedTimePicker, setShowBedTimePicker] = useState(false);
  const [showWakeDatePicker, setShowWakeDatePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadSleepData();
  }, []);

  // Save data whenever sleepData changes
  useEffect(() => {
    if (!loading) {
      saveSleepData();
    }
  }, [sleepData, loading]);

  const loadSleepData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('sleepData');
      if (savedData) {
        setSleepData(JSON.parse(savedData));
      } else {
        // Initialize with sample data for first time users
        const sampleData = [
          { date: getDateString(-6), bedTime: '23:00', wakeTime: '07:30', hours: 8.5 },
          { date: getDateString(-5), bedTime: '22:30', wakeTime: '06:45', hours: 8.25 },
          { date: getDateString(-4), bedTime: '23:15', wakeTime: '07:15', hours: 8 },
          { date: getDateString(-3), bedTime: '22:45', wakeTime: '07:00', hours: 8.25 },
          { date: getDateString(-2), bedTime: '23:30', wakeTime: '07:45', hours: 8.25 },
          { date: getDateString(-1), bedTime: '22:15', wakeTime: '06:30', hours: 8.25 },
        ];
        setSleepData(sampleData);
      }
    } catch (error) {
      console.log('Error loading sleep data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSleepData = async () => {
    try {
      await AsyncStorage.setItem('sleepData', JSON.stringify(sleepData));
    } catch (error) {
      console.log('Error saving sleep data:', error);
    }
  };

  function getDateString(daysOffset) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + daysOffset);
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
  }

  function calculateSleepHours(bedDateTime, wakeDateTime) {
    const bedTime = new Date(bedDateTime);
    const wakeTime = new Date(wakeDateTime);
    
    if (wakeTime <= bedTime) {
      return 0;
    }
    
    return (wakeTime - bedTime) / (1000 * 60 * 60);
  }

  const validateSleepTimes = () => {
    const sleepHours = calculateSleepHours(bedDateTime, wakeDateTime);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (bedDateTime > today) {
      Alert.alert('Invalid Date', 'You cannot enter sleep data for future dates. Please select today or an earlier date.');
      return false;
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    if (wakeDateTime > tomorrow) {
      Alert.alert('Invalid Date', 'Wake time cannot be more than tomorrow. Please adjust your wake time.');
      return false;
    }
    
    if (sleepHours <= 0) {
      Alert.alert('Invalid Time', 'Wake time must be after bedtime. Please adjust your times.');
      return false;
    }
    
    if (sleepHours > 24) {
      Alert.alert('Invalid Duration', 'Sleep duration cannot exceed 24 hours. Please check your times.');
      return false;
    }
    
    return true;
  };

  const calculateDailySleepAllocation = (bedDateTime, wakeDateTime, totalHours) => {
    const bedTime = new Date(bedDateTime);
    const wakeTime = new Date(wakeDateTime);
    const allocation = [];
    
    const currentDate = new Date(bedTime);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate < wakeTime) {
      const dateString = currentDate.getFullYear() + '-' + 
                        String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(currentDate.getDate()).padStart(2, '0');
      
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const sleepStart = bedTime > dayStart ? bedTime : dayStart;
      const sleepEnd = wakeTime < dayEnd ? wakeTime : dayEnd;
      
      if (sleepStart < sleepEnd) {
        const hoursThisDay = (sleepEnd - sleepStart) / (1000 * 60 * 60);
        
        let sleepType = 'full';
        if (bedTime >= dayStart && wakeTime <= dayEnd) {
          sleepType = 'full';
        } else if (bedTime >= dayStart) {
          sleepType = 'start';
        } else if (wakeTime <= dayEnd) {
          sleepType = 'end';
        } else {
          sleepType = 'middle';
        }
        
        allocation.push({
          date: dateString,
          hours: parseFloat(hoursThisDay.toFixed(2)),
          sleepType: sleepType
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return allocation;
  };

  const addSleepData = () => {
    if (!bedDateTime || !wakeDateTime) {
      Alert.alert('Error', 'Please select both bedtime and wake time');
      return;
    }

    if (!validateSleepTimes()) {
      return;
    }

    const totalHours = calculateSleepHours(bedDateTime, wakeDateTime);
    const sleepAllocation = calculateDailySleepAllocation(bedDateTime, wakeDateTime, totalHours);
    
    setSleepData(prev => {
      let newData = [...prev];
      
      if (editingEntry) {
        // If editing, remove only the entries for this specific sleep session
        newData = newData.filter(item => 
          !(item.bedDateTime === editingEntry.bedDateTime && 
            item.wakeDateTime === editingEntry.wakeDateTime)
        );
      }
      // If adding new (not editing), we don't remove existing entries - just add new ones
      
      // Add new sleep allocation entries
      sleepAllocation.forEach(dayData => {
        if (dayData.hours > 0) {
          newData.push({
            date: dayData.date,
            bedTime: bedDateTime.toTimeString().slice(0, 5),
            wakeTime: wakeDateTime.toTimeString().slice(0, 5),
            bedDateTime: bedDateTime.toISOString(),
            wakeDateTime: wakeDateTime.toISOString(),
            hours: dayData.hours,
            totalSleepHours: totalHours,
            sleepType: dayData.sleepType
          });
        }
      });
      
      return newData.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    setShowAddForm(false);
    setEditingEntry(null);
    resetForm();
    
    const affectedDays = sleepAllocation.filter(d => d.hours > 0).length;
    Alert.alert('Success', 
      editingEntry 
        ? 'Sleep data updated successfully!' 
        : `Sleep data added! Total: ${totalHours.toFixed(1)}h split across ${affectedDays} day(s)`
    );
  };

  const resetForm = () => {
    const now = new Date();
    now.setHours(22, 0, 0, 0);
    setBedDateTime(now);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);
    setWakeDateTime(tomorrow);
  };

  const editSleepData = (entry) => {
    setEditingEntry(entry);
    
    if (entry.bedDateTime && entry.wakeDateTime) {
      setBedDateTime(new Date(entry.bedDateTime));
      setWakeDateTime(new Date(entry.wakeDateTime));
    } else {
      const bedDate = new Date(entry.date + 'T' + entry.bedTime + ':00');
      setBedDateTime(bedDate);
      
      const wakeDate = new Date(entry.date + 'T' + entry.wakeTime + ':00');
      if (wakeDate <= bedDate) {
        wakeDate.setDate(wakeDate.getDate() + 1);
      }
      setWakeDateTime(wakeDate);
    }
    
    setShowAddForm(true);
  };

  const showDeleteOptions = (day) => {
    if (!day.hasMultipleSessions) {
      deleteSleepData(day.date);
      return;
    }

    Alert.alert(
      'Multiple Sleep Sessions',
      `This day has ${day.entries.length} sleep sessions totaling ${day.hours}h. Which would you like to delete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...day.entries.map((entry, index) => ({
          text: `Delete Session ${index + 1} (${entry.hours}h)`,
          style: 'destructive',
          onPress: () => deleteSleepData(entry.date, entry.bedDateTime)
        })),
        {
          text: 'Delete All Sessions',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Delete All',
              `Are you sure you want to delete all ${day.entries.length} sleep sessions for ${day.date}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete All', 
                  style: 'destructive',
                  onPress: () => {
                    setSleepData(prev => prev.filter(item => item.date !== day.date));
                    Alert.alert('Success', `All sleep sessions for ${day.date} deleted!`);
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const deleteSleepData = (date, specificBedDateTime = null) => {
    let entryToDelete;
    
    if (specificBedDateTime) {
      entryToDelete = sleepData.find(item => 
        item.date === date && item.bedDateTime === specificBedDateTime
      );
    } else {
      entryToDelete = sleepData.find(item => item.date === date);
    }
    
    if (!entryToDelete) return;
    
    const isMultiDaySession = entryToDelete.bedDateTime && 
                             entryToDelete.wakeDateTime &&
                             entryToDelete.sleepType !== 'full';
    
    let alertMessage = 'Are you sure you want to delete this sleep record?';
    let confirmText = 'Delete';
    
    if (isMultiDaySession) {
      const sessionEntries = sleepData.filter(item => 
        item.bedDateTime === entryToDelete.bedDateTime && 
        item.wakeDateTime === entryToDelete.wakeDateTime
      );
      
      const remainingDays = sessionEntries.filter(item => item.date !== date);
      
      if (remainingDays.length > 0) {
        alertMessage = `This will delete only the sleep hours for this day (${date}). The remaining ${remainingDays.length} day(s) of this sleep session will be kept.`;
        confirmText = 'Delete This Day Only';
      } else {
        alertMessage = 'This is the last day of this sleep session. Deleting it will remove the entire sleep session.';
        confirmText = 'Delete Last Day';
      }
    }
    
    Alert.alert(
      'Delete Sleep Data',
      alertMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: confirmText, 
          style: 'destructive',
          onPress: () => {
            if (isMultiDaySession) {
              const sessionEntries = sleepData.filter(item => 
                item.bedDateTime === entryToDelete.bedDateTime && 
                item.wakeDateTime === entryToDelete.wakeDateTime
              );
              
              const remainingDays = sessionEntries.filter(item => item.date !== date);
              
              if (remainingDays.length > 0) {
                setSleepData(prev => prev.filter(item => 
                  !(item.date === date && item.bedDateTime === entryToDelete.bedDateTime)
                ));
                Alert.alert('Success', `Sleep data for ${date} deleted. ${remainingDays.length} day(s) preserved.`);
              } else {
                const allSessionDates = sessionEntries.map(item => item.date);
                setSleepData(prev => prev.filter(item => 
                  !(allSessionDates.includes(item.date) && item.bedDateTime === entryToDelete.bedDateTime)
                ));
                Alert.alert('Success', 'Last day of sleep session deleted. Entire session removed.');
              }
            } else {
              if (specificBedDateTime) {
                setSleepData(prev => prev.filter(item => 
                  !(item.date === date && item.bedDateTime === specificBedDateTime)
                ));
              } else {
                setSleepData(prev => prev.filter(item => item.date !== date));
              }
              Alert.alert('Success', 'Sleep data deleted successfully!');
            }
          }
        }
      ]
    );
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    let dateStr;
    if (isToday) {
      dateStr = 'Today';
    } else if (isTomorrow) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${dateStr}, ${timeStr}`;
  };

  const onDateChange = (event, selectedDate, type) => {
    if (Platform.OS === 'android') {
      setShowBedDatePicker(false);
      setShowBedTimePicker(false);
      setShowWakeDatePicker(false);
      setShowWakeTimePicker(false);
    }
    
    if (selectedDate) {
      if (type === 'bedDate') {
        const newBedDateTime = new Date(bedDateTime);
        newBedDateTime.setFullYear(selectedDate.getFullYear());
        newBedDateTime.setMonth(selectedDate.getMonth());
        newBedDateTime.setDate(selectedDate.getDate());
        setBedDateTime(newBedDateTime);
      } else if (type === 'bedTime') {
        const newBedDateTime = new Date(bedDateTime);
        newBedDateTime.setHours(selectedDate.getHours());
        newBedDateTime.setMinutes(selectedDate.getMinutes());
        setBedDateTime(newBedDateTime);
      } else if (type === 'wakeDate') {
        const newWakeDateTime = new Date(wakeDateTime);
        newWakeDateTime.setFullYear(selectedDate.getFullYear());
        newWakeDateTime.setMonth(selectedDate.getMonth());
        newWakeDateTime.setDate(selectedDate.getDate());
        setWakeDateTime(newWakeDateTime);
      } else if (type === 'wakeTime') {
        const newWakeDateTime = new Date(wakeDateTime);
        newWakeDateTime.setHours(selectedDate.getHours());
        newWakeDateTime.setMinutes(selectedDate.getMinutes());
        setWakeDateTime(newWakeDateTime);
      }
    }
  };

  const getWeeklyData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekDays = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.getFullYear() + '-' + 
                        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(date.getDate()).padStart(2, '0');
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Find ALL sleep entries for this date and sum them up
      const sleepEntries = sleepData.filter(entry => entry.date === dateString);
      const totalHours = sleepEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      
      // Get the most recent entry for display purposes (edit/delete functionality)
      const latestEntry = sleepEntries.length > 0 ? 
        sleepEntries.sort((a, b) => new Date(b.bedDateTime || '1970-01-01') - new Date(a.bedDateTime || '1970-01-01'))[0] : 
        null;
      
      weekDays.push({
        day: dayName,
        date: dateString,
        hours: parseFloat(totalHours.toFixed(2)), // This is the aggregated total
        entries: sleepEntries, // Store all entries for this date
        latestEntry: latestEntry, // Most recent entry for interactions
        hasMultipleSessions: sleepEntries.length > 1 // True if more than one sleep session
      });
    }
    
    return weekDays;
  };

  const getWeeklyAverage = () => {
    const weekData = getWeeklyData();
    const totalHours = weekData.reduce((sum, day) => sum + day.hours, 0);
    const daysWithData = weekData.filter(day => day.hours > 0).length;
    return daysWithData > 0 ? (totalHours / daysWithData).toFixed(1) : '0.0';
  };

  const getQualityMessage = (average) => {
    const avg = parseFloat(average);
    if (avg >= 8) return { text: "Excellent sleep!", color: "#10b981", icon: "💤" };
    if (avg >= 7) return { text: "Good sleep", color: "#3b82f6", icon: "😴" };
    if (avg >= 6) return { text: "Fair sleep", color: "#f59e0b", icon: "😐" };
    return { text: "Need more sleep", color: "#ef4444", icon: "😴" };
  };

  const weeklyData = getWeeklyData();
  const weeklyAverage = getWeeklyAverage();
  const qualityMessage = getQualityMessage(weeklyAverage);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading sleep data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8b5cf6" />
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#8b5cf6', '#3b82f6']}
          style={styles.addButtonGradient}
        >
          <Text style={styles.addButtonText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <LinearGradient
          colors={['#8b5cf6', '#3b82f6']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerIcon}>🌙</Text>
            <Text style={styles.headerTitle}>Sleep Tracker</Text>
          </View>
          <Text style={styles.headerSubtitle}>Monitor your sleep patterns for better health</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📈</Text>
              <Text style={styles.cardTitle}>Weekly Sleep Pattern</Text>
            </View>
            <View style={styles.chartContainer}>
              <View style={styles.chart}>
                {weeklyData.map((day, index) => {
                  const maxHeight = 180;
                  const barHeight = Math.max((day.hours / 10) * maxHeight, 6);
                  const hasData = day.hours > 0;
                  
                  return (
                    <View key={index} style={[styles.barContainer, { width: (width - 110) / 7 }]}>
                      <Text style={styles.barValue}>
                        {hasData ? `${day.hours}h` : ''}
                        {day.hasMultipleSessions && (
                          <Text style={styles.sessionCount}> ({day.entries.length})</Text>
                        )}
                      </Text>
                      <TouchableOpacity
                        onPress={() => hasData && day.latestEntry && editSleepData(day.latestEntry)}
                        onLongPress={() => hasData && showDeleteOptions(day)}
                        activeOpacity={hasData ? 0.7 : 1}
                        style={styles.barTouchable}
                      >
                        <LinearGradient
                          colors={hasData ? ['#8b5cf6', '#3b82f6'] : ['#e5e7eb', '#d1d5db']}
                          style={[
                            styles.bar,
                            { 
                              height: barHeight,
                              width: Math.min(30, (width - 80) / 7 - 4)
                            }
                          ]}
                        />
                        {day.hasMultipleSessions && (
                          <View style={styles.multipleSessionsIndicator}>
                            <View style={styles.sessionDot} />
                            <View style={styles.sessionDot} />
                          </View>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.barLabel}>{day.day}</Text>
                      {hasData && day.latestEntry && (
                        <View style={styles.editHint}>
                          <Text style={styles.editHintText}>
                            {day.hasMultipleSessions ? '📊' : 
                             day.latestEntry.sleepType === 'start' ? '🌙' : 
                             day.latestEntry.sleepType === 'end' ? '☀️' : 
                             day.latestEntry.sleepType === 'middle' ? '💤' : '✏️'}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
              
              <View style={styles.yAxisLabels}>
                <Text style={styles.axisLabel}>0h</Text>
                <Text style={styles.axisLabel}>2h</Text>
                <Text style={styles.axisLabel}>4h</Text>
                <Text style={styles.axisLabel}>6h</Text>
                <Text style={styles.axisLabel}>8h</Text>
                <Text style={styles.axisLabel}>10h</Text>
              </View>
              
              <Text style={styles.chartHint}>
                💡 Tap to edit • Long press to delete{'\n'}
                🌙 Sleep starts • ☀️ Sleep ends • 💤 Sleep continues • 📊 Multiple sessions
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⏰</Text>
              <Text style={styles.cardTitle}>Weekly Average</Text>
            </View>
            <View style={styles.averageContainer}>
              <Text style={styles.averageValue}>{weeklyAverage}h</Text>
              <View style={styles.qualityMessage}>
                <Text style={styles.qualityIcon}>{qualityMessage.icon}</Text>
                <Text style={[styles.qualityText, { color: qualityMessage.color }]}>
                  {qualityMessage.text}
                </Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Recommended</Text>
                  <Text style={styles.statValueGreen}>7-9 hours</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Your Average</Text>
                  <Text style={styles.statValuePurple}>{weeklyAverage}h</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Days Tracked</Text>
                  <Text style={styles.statValueBlue}>
                    {weeklyData.filter(d => d.hours > 0).length}/7
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📚</Text>
              <Text style={styles.cardTitle}>Why Sleep Matters</Text>
            </View>
            
            <View style={styles.articleContainer}>
              <LinearGradient
                colors={['#f0fdf4', '#ecfdf5']}
                style={styles.articleSection}
              >
                <View style={styles.articleHeader}>
                  <Text style={styles.articleIcon}>🧠</Text>
                  <Text style={styles.articleTitle}>Cognitive Benefits</Text>
                </View>
                <Text style={styles.articleText}>
                  Quality sleep enhances memory consolidation, improves focus, and boosts problem-solving abilities. 
                  During sleep, your brain processes information from the day and forms long-term memories.
                </Text>
              </LinearGradient>

              <LinearGradient
                colors={['#fef2f2', '#fef7f7']}
                style={styles.articleSection}
              >
                <View style={styles.articleHeader}>
                  <Text style={styles.articleIcon}>❤️</Text>
                  <Text style={styles.articleTitle}>Physical Health</Text>
                </View>
                <Text style={styles.articleText}>
                  Adequate sleep supports immune function, helps regulate hormones, and promotes tissue repair. 
                  Chronic sleep deprivation is linked to increased risk of heart disease, diabetes, and obesity.
                </Text>
              </LinearGradient>

              <LinearGradient
                colors={['#eff6ff', '#f0f8ff']}
                style={styles.articleSection}
              >
                <View style={styles.articleHeader}>
                  <Text style={styles.articleIcon}>⚡</Text>
                  <Text style={styles.articleTitle}>Energy & Performance</Text>
                </View>
                <Text style={styles.articleText}>
                  Well-rested individuals show improved reaction times, better decision-making, and increased productivity. 
                  Sleep helps restore energy levels and prepares your body for the challenges ahead.
                </Text>
              </LinearGradient>

              <LinearGradient
                colors={['#faf5ff', '#fbf7ff']}
                style={styles.articleSection}
              >
                <Text style={styles.articleTitle}>💡 Sleep Tips</Text>
                <Text style={styles.articleText}>
                  • Maintain a consistent sleep schedule, even on weekends{'\n'}
                  • Create a relaxing bedtime routine{'\n'}
                  • Keep your bedroom cool, dark, and quiet{'\n'}
                  • Avoid screens 1 hour before bedtime{'\n'}
                  • Limit caffeine intake after 2 PM
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showAddForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalIcon}>🌙</Text>
              <Text style={styles.modalTitle}>
                {editingEntry ? 'Edit Sleep Data' : 'Add Sleep Data'}
              </Text>
              {editingEntry && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => {
                    setShowAddForm(false);
                    deleteSleepData(editingEntry.date);
                  }}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bedtime</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity 
                  style={[styles.dateTimeButton, styles.dateButton]}
                  onPress={() => setShowBedDatePicker(true)}
                >
                  <Text style={styles.dateTimeButtonText}>
                    📅 {bedDateTime.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dateTimeButton, styles.timeButton]}
                  onPress={() => setShowBedTimePicker(true)}
                >
                  <Text style={styles.dateTimeButtonText}>
                    🕐 {bedDateTime.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.fullDateTime}>
                {formatDateTime(bedDateTime)}
              </Text>
              {bedDateTime > new Date() && (
                <Text style={styles.warningHint}>
                  ⚠️ Bedtime cannot be in the future
                </Text>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Wake Time</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity 
                  style={[styles.dateTimeButton, styles.dateButton]}
                  onPress={() => setShowWakeDatePicker(true)}
                >
                  <Text style={styles.dateTimeButtonText}>
                    📅 {wakeDateTime.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dateTimeButton, styles.timeButton]}
                  onPress={() => setShowWakeTimePicker(true)}
                >
                  <Text style={styles.dateTimeButtonText}>
                    🕐 {wakeDateTime.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.fullDateTime}>
                {formatDateTime(wakeDateTime)}
              </Text>
              {(() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(23, 59, 59, 999);
                return wakeDateTime > tomorrow;
              })() && (
                <Text style={styles.warningHint}>
                  ⚠️ Wake time cannot be more than tomorrow
                </Text>
              )}
            </View>
            
            <View style={styles.durationDisplay}>
              <Text style={styles.durationLabel}>Sleep Duration</Text>
              <Text style={[
                styles.durationValue, 
                { color: calculateSleepHours(bedDateTime, wakeDateTime) <= 0 ? '#ef4444' : '#8b5cf6' }
              ]}>
                {calculateSleepHours(bedDateTime, wakeDateTime) <= 0 
                  ? 'Invalid time selection' 
                  : `${calculateSleepHours(bedDateTime, wakeDateTime).toFixed(1)} hours`
                }
              </Text>
              {calculateSleepHours(bedDateTime, wakeDateTime) <= 0 && (
                <Text style={styles.errorHint}>
                  ⚠️ Wake time must be after bedtime
                </Text>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                  resetForm();
                }}
                style={styles.cancelButton}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addSleepData}
                style={styles.addDataButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#3b82f6']}
                  style={styles.addDataButtonGradient}
                >
                  <Text style={styles.addDataButtonText}>
                    {editingEntry ? 'Update Sleep' : 'Add Sleep'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showBedDatePicker && (
        <DateTimePicker
          value={bedDateTime}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => onDateChange(event, selectedDate, 'bedDate')}
          maximumDate={new Date()}
        />
      )}
      
      {showBedTimePicker && (
        <DateTimePicker
          value={bedDateTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => onDateChange(event, selectedDate, 'bedTime')}
        />
      )}
      
      {showWakeDatePicker && (
        <DateTimePicker
          value={wakeDateTime}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => onDateChange(event, selectedDate, 'wakeDate')}
          maximumDate={(() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
          })()}
        />
      )}
      
      {showWakeTimePicker && (
        <DateTimePicker
          value={wakeDateTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => onDateChange(event, selectedDate, 'wakeTime')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  addButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    color: '#e0e7ff',
    fontSize: 16,
  },
  content: {
    padding: 24,
    marginTop: -16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  chartContainer: {
    height: 320,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    paddingHorizontal: 0,
    paddingBottom: 25,
    marginBottom: 15,
    marginTop: 20,
  },
  barContainer: {
    alignItems: 'center',
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    minHeight: 14,
  },
  sessionCount: {
    fontSize: 9,
    fontWeight: '400',
    color: '#6b7280',
  },
  barTouchable: {
    alignItems: 'center',
    position: 'relative',
  },
  bar: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
  },
  editHint: {
    marginTop: 2,
  },
  editHintText: {
    fontSize: 10,
  },
  multipleSessionsIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    flexDirection: 'row',
    gap: 2,
  },
  sessionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  chartHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 10,
  },
  yAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  axisLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 8,
  },
  qualityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  qualityIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  qualityText: {
    fontSize: 18,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValueGreen: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
  },
  statValuePurple: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
    textAlign: 'center',
  },
  statValueBlue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'center',
  },
  articleContainer: {
    gap: 16,
  },
  articleSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  articleText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    flex: 1.2,
  },
  timeButton: {
    flex: 1,
  },
  dateTimeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  fullDateTime: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  durationDisplay: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  durationValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    textAlign: 'center',
  },
  warningHint: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  addDataButton: {
    flex: 1,
    borderRadius: 12,
  },
  addDataButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addDataButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default SleepScreen;